// © 2025 Debraj. All Rights Reserved.
// respect the work, don't just copy-paste.

const fs = require('fs')

const config = {
    owner: "DARKX-MD",
    botNumber: process.env.BOT_NUMBER || "255700000000",
    setPair: "DARKXXMD", // constant custom pairing code shown on WhatsApp linking screen
    thumbUrl: "https://i.imgur.com/IkEv97P.jpeg",
    session: "sessions",
    status: {
        public: true,
        terminal: true,
        reactsw: true
    },
    message: {
        owner: "no, this is for owners only",
        group: "this is for groups only",
        admin: "this command is for admin only",
        private: "this is specifically for private chat"
    },
    mess: {
        owner: 'This command is only for the bot owner!',
        done: 'Mode changed successfully!',
        error: 'Something went wrong!',
        wait: 'Please wait...'
    },
    settings: {
        title: "DARKX ULTRA",
        packname: 'DARKX-ULTRA',
        description: "this script was created by MrX Dev",
        author: 'https://www.github.com/DarkX-pro',
        footer: "🔰 Developed by: @MrX_Dev"
    },
    newsletter: {
        name: "DARKX ULTRA Official",
        id: "120363426285893376@newsletter"
    },
    api: {
        baseurl: "https://hector-api.vercel.app/",
        apikey: "hector"
    },
    sticker: {
        packname: "DARKX ULTRA",
        author: "MrX Dev"
    }
}

module.exports = config;

let file = require.resolve(__filename)
require('fs').watchFile(file, () => {
  require('fs').unwatchFile(file)
  console.log('\x1b[0;32m'+__filename+' \x1b[1;32mupdated!\x1b[0m')
  delete require.cache[file]
  require(file)
})