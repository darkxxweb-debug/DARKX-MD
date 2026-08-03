const chalk = require('chalk');
const pino = require('pino');
const { Boom } = require('@hapi/boom');
const config = require('./config');
const { useMongoAuthState } = require('./authState');
const Session = require('./Session');
const User = require('./User');

// phone -> { sock, store }
const sessions = new Map();

let makeWASocket, Browsers, DisconnectReason, fetchLatestBaileysVersion, jidDecode;

async function loadBaileys() {
    if (makeWASocket) return;
    const baileys = await import('@whiskeysockets/baileys');
    makeWASocket = baileys.default;
    Browsers = baileys.Browsers;
    DisconnectReason = baileys.DisconnectReason;
    fetchLatestBaileysVersion = baileys.fetchLatestBaileysVersion;
    jidDecode = baileys.jidDecode;
}

function makeStore() {
    const messages = new Map();
    const store = {
        messages,
        contacts: new Map(),
        groupMetadata: new Map(),
        loadMessage: async (jid, id) => messages.get(`${jid}:${id}`) || null,
        bind(ev) {
            ev.on('messages.upsert', ({ messages: msgs }) => {
                for (const msg of msgs) {
                    if (msg.key?.remoteJid && msg.key?.id) {
                        messages.set(`${msg.key.remoteJid}:${msg.key.id}`, msg);
                    }
                }
            });
        }
    };
    return store;
}

function getSession(phone) {
    return sessions.get(phone);
}

function getActiveSessions() {
    return Array.from(sessions.keys());
}

/**
 * Starts (or resumes) a WhatsApp session for a given phone number.
 * @param {string} phone - MSISDN without '+', e.g. 255700000000
 * @param {object} opts
 * @param {(code:string)=>void} opts.onPairingCode - called once the pairing code is generated
 * @param {(status:string)=>void} opts.onStatus - called on connection status changes
 */
async function startSession(phone, { onPairingCode, onStatus } = {}) {
    await loadBaileys();

    if (sessions.has(phone)) {
        return sessions.get(phone).sock;
    }

    let state, saveCreds, version, store, sock;
    try {
        ({ state, saveCreds } = await useMongoAuthState(phone));
    } catch (err) {
        console.error(chalk.red(`[${phone}] useMongoAuthState failed (check MONGO_URI / DB connectivity):`), err);
        throw err;
    }

    try {
        ({ version } = await fetchLatestBaileysVersion());
    } catch (err) {
        console.error(chalk.red(`[${phone}] fetchLatestBaileysVersion failed (check outbound network access):`), err);
        throw err;
    }

    store = makeStore();

    try {
        sock = makeWASocket({
            logger: pino({ level: 'silent' }),
            auth: state,
            version,
            printQRInTerminal: false,
            browser: Browsers.ubuntu('Chrome')
        });
    } catch (err) {
        console.error(chalk.red(`[${phone}] makeWASocket failed:`), err);
        throw err;
    }

    sessions.set(phone, { sock, store });

    store.bind(sock.ev);
    sock.ev.on('creds.update', saveCreds);

    // Request the pairing code once, using our constant custom code (DARKX-MD branding).
    if (!sock.authState.creds.registered) {
        console.log(chalk.yellow(`[${phone}] requesting pairing code from WhatsApp...`));
        try {
            const code = await sock.requestPairingCode(phone, config.setPair);
            console.log(chalk.green(`[${phone}] pairing code received: ${code}`));
            onStatus?.('pairing');
            onPairingCode?.(code);
        } catch (err) {
            console.error(chalk.red(`[${phone}] Failed to request pairing code:`), err);
            onStatus?.('error');
        }
    }

    sock.ev.on('connection.update', async (update) => {
        console.log(chalk.gray(`[${phone}] connection.update:`), JSON.stringify({
            connection: update.connection,
            qr: !!update.qr,
            isNewLogin: update.isNewLogin,
            statusCode: update.lastDisconnect?.error?.output?.statusCode
        }));
        const { connection, lastDisconnect } = update;

        if (connection === 'open') {
            console.log(chalk.green(`[${phone}] connected`));
            await Session.updateOne({ phone }, { $set: { status: 'connected', connectedAt: new Date() } });
            onStatus?.('connected');
        }

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const loggedOut = statusCode === DisconnectReason.loggedOut;
            sessions.delete(phone);

            if (loggedOut) {
                await Session.updateOne({ phone }, { $set: { status: 'disconnected' } });
                onStatus?.('logged_out');
            } else {
                onStatus?.('reconnecting');
                setTimeout(() => startSession(phone, { onStatus }).catch(() => {}), 4000);
            }
        }
    });

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const mek = chatUpdate.messages[0];
            if (!mek.message) return;
            mek.message = Object.keys(mek.message)[0] === 'ephemeralMessage'
                ? mek.message.ephemeralMessage.message
                : mek.message;

            const user = await User.findOne({ phone });
            sock.settings = user?.settings || {};
            sock.public = sock.settings.publicMode !== false;

            if (!sock.public && !mek.key.fromMe && chatUpdate.type === 'notify') return;

            const { smsg } = require('./serialize');
            const m = await smsg(sock, mek, store);
            require('./message')(sock, m, chatUpdate, store);
        } catch (err) {
            console.log(chalk.red('[msg-handler]'), err);
        }
    });

    sock.decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            const decode = jidDecode(jid) || {};
            return (decode.user && decode.server && decode.user + '@' + decode.server) || jid;
        }
        return jid;
    };

    return sock;
}

/** Restores every session that was previously connected, e.g. after a dyno restart. */
async function restoreAllSessions() {
    const docs = await Session.find({ status: 'connected' });
    console.log(chalk.cyan(`[sessions] restoring ${docs.length} connected session(s)...`));
    for (const doc of docs) {
        startSession(doc.phone).catch((e) => console.log(chalk.red(`[${doc.phone}] restore failed:`), e.message));
    }
}

async function stopSession(phone) {
    const entry = sessions.get(phone);
    if (entry) {
        try { await entry.sock.logout(); } catch (_) {}
        sessions.delete(phone);
    }
}

module.exports = {
    startSession,
    stopSession,
    getSession,
    getActiveSessions,
    restoreAllSessions
};
