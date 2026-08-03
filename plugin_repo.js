module.exports = {
    command: 'repo',
    description: 'View DARKX ULTRA bot repository details',
    category: 'general',
    execute: async (sock, m, {
        args,
        text,
        q,
        quoted,
        mime,
        qmsg,
        isMedia,
        groupMetadata,
        groupName,
        participants,
        groupOwner,
        groupAdmins,
        isBotAdmins,
        isAdmins,
        isGroupOwner,
        isCreator,
        prefix,
        reply,
        config,
        sender
    }) => {
        try {
            // Reaction
            await sock.sendMessage(m.chat, { 
                react: { text: "📦", key: m.key } 
            });

            // Get bot info
            const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            const uptimeSec = process.uptime();
            const days = Math.floor(uptimeSec / (3600 * 24));
            const hours = Math.floor((uptimeSec % (3600 * 24)) / 3600);
            const minutes = Math.floor((uptimeSec % 3600) / 60);
            const seconds = Math.floor(uptimeSec % 60);
            const uptime = `${days}d ${hours}h ${minutes}m ${seconds}s`;
            
            const usedMem = process.memoryUsage().heapUsed / 1024 / 1024;
            const totalMem = os.totalmem() / 1024 / 1024 / 1024;
            const memPercent = (usedMem / (totalMem * 1024)) * 100;
            const ramBar = '▣'.repeat(Math.floor(memPercent / 20)) + '▢'.repeat(5 - Math.floor(memPercent / 20));
            const host = os.platform();
            const ping = Date.now() - m.messageTimestamp * 1000;

            const repoMessage = `
╔══════════════════════════════════
║       ★ DARKX ULTRA ★          
║    WhatsApp Multi-Device Bot    
║══════════════════════════════════
║
║  🤖 *Bot Information*
║  ═══════════════════
║  ✦ Name        : DARKX ULTRA
║  ✦ Version     : 2.0.0
║  ✦ Language    : JavaScript
║  ✦ Framework   : Baileys
║  ✦ Platform    : ${host}
║  ✦ Uptime      : ${uptime}
║  ✦ Ping        : ${ping.toFixed(0)} ms
║  ✦ RAM Usage   : ${usedMem.toFixed(2)} MB / ${totalMem.toFixed(2)} GB
║  ✦ RAM Status  : [${ramBar}] ${memPercent.toFixed(2)}%
║
║  👑 *Owner Information*
║  ═══════════════════
║  ✦ Name        : MrX Dev
║  ✦ Number      : +255 775 710 774
║  ✦ WhatsApp    : wa.me/255775710774
║  ✦ Telegram    : @MrX_Dev
║  ✦ GitHub      : github.com/MrX-Dev
║
║  🛠️ *Features & Commands*
║  ═══════════════════
║  ✦ Downloader  : Video, Audio, Play
║  ✦ Group Tools : Tagall, Tagonline, Gst
║  ✦ Admin Tools : Promote, Demote, Kick, Add
║  ✦ Fun         : Coming Soon...
║  ✦ AI          : Coming Soon...
║
║  📢 *Support & Updates*
║  ═══════════════════
║  ✦ Channel     : whatsapp.com/channel/0029VbCdURHH5JM4JJHYAo2X
║  ✦ Support     : +255 775 710 774
║  ✦ Status      : 🟢 Active
║
║  💀 *Powered By*
║  ═══════════════════
║  ✦ MrX Dev
║  ✦ DARKX ULTRA Team
║  ✦ © 2025 All Rights Reserved
║
╚══════════════════════════════════

💀 *DARKX ULTRA - The Ultimate WhatsApp Bot* 💀`;

            // Send repo message with newsletter forwarding
            await sock.sendMessage(m.chat, {
                text: repoMessage,
                contextInfo: {
                    mentionedJid: [m.sender],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363426285893376@newsletter",
                        newsletterName: "DARKX ULTRA Official",
                        serverMessageId: "1"
                    },
                    externalAdReply: {
                        title: "★ DARKX ULTRA Bot ★",
                        body: "Click to join our channel!",
                        mediaType: 1,
                        thumbnailUrl: config.thumbUrl,
                        sourceUrl: "https://whatsapp.com/channel/0029VbCdURHH5JM4JJHYAo2X",
                        mediaUrl: "https://whatsapp.com/channel/0029VbCdURHH5JM4JJHYAo2X",
                        showAdAttribution: true,
                        renderLargerThumbnail: false
                    }
                }
            }, { quoted: m });

            // Success reaction
            await sock.sendMessage(m.chat, { 
                react: { text: "✅", key: m.key } 
            });

        } catch (error) {
            console.error('Error in repo command:', error);
            await sock.sendMessage(m.chat, { 
                react: { text: "❌", key: m.key } 
            });
            await reply("❌ Failed to fetch repository details. Please try again!");
        }
    }
};