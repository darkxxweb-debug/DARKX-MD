// MongoDB backed replacement for Baileys' useMultiFileAuthState so that every
// paired number's session (creds + signal keys) lives in the database instead
// of the local filesystem. This is what makes multi-session hosting possible
// across dyno restarts on Heroku (the local disk is ephemeral there).

const Session = require('./Session');

let initAuthCreds, BufferJSON;

async function loadBaileysUtils() {
    if (initAuthCreds && BufferJSON) return;
    const baileys = await import('@whiskeysockets/baileys');
    initAuthCreds = baileys.initAuthCreds;
    BufferJSON = baileys.BufferJSON;
}

function serialize(data) {
    return JSON.parse(JSON.stringify(data, BufferJSON.replacer));
}

function deserialize(data) {
    return JSON.parse(JSON.stringify(data), BufferJSON.reviver);
}

async function useMongoAuthState(phone) {
    await loadBaileysUtils();

    let doc = await Session.findOne({ phone });
    if (!doc) {
        doc = await Session.create({ phone, creds: serialize(initAuthCreds()), keys: {} });
    }

    let creds = doc.creds ? deserialize(doc.creds) : initAuthCreds();
    let keys = doc.keys ? deserialize(doc.keys) : {};

    const saveState = async () => {
        await Session.updateOne(
            { phone },
            { $set: { creds: serialize(creds), keys: serialize(keys) } },
            { upsert: true }
        );
    };

    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data = {};
                    for (const id of ids) {
                        let value = keys[type]?.[id];
                        if (value) {
                            if (type === 'app-state-sync-key' && value) {
                                // keep raw, baileys handles proto decoding upstream when needed
                            }
                            data[id] = value;
                        }
                    }
                    return data;
                },
                set: async (data) => {
                    for (const type in data) {
                        keys[type] = keys[type] || {};
                        for (const id in data[type]) {
                            const value = data[type][id];
                            if (value) keys[type][id] = value;
                            else delete keys[type][id];
                        }
                    }
                    await saveState();
                }
            }
        },
        saveCreds: saveState,
        clearState: async () => {
            await Session.deleteOne({ phone });
        }
    };
}

module.exports = { useMongoAuthState };
