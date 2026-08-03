module.exports = {
    command: 'tagall',
    description: 'Tag all group members',
    category: 'group',
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
            // Check if in group
            if (!m.isGroup) {
                return await reply("❌ This command can only be used in groups!");
            }

            // Check if bot is admin
            if (!isBotAdmins) {
                return await reply("❌ I need to be an admin to mention everyone!");
            }

            // Get message to tag with
            const tagMessage = text || "📢 Attention everyone!";

            // Get all group participants
            const groupMembers = participants.map(p => p.id);
            
            // Create mention list
            const mentions = groupMembers.map(jid => jid);

            // Create tag message
            let tagText = `👥 *TAG ALL*\n\n📝 Message: ${tagMessage}\n\n👤 Members (${groupMembers.length}):\n`;
            
            // Add members with numbers
            groupMembers.forEach((jid, index) => {
                const number = jid.split('@')[0];
                tagText += `${index + 1}. @${number}\n`;
            });

            tagText += `\n\n💀 DARKX ULTRA Tag All`;

            // Send message with mentions
            await sock.sendMessage(m.chat, {
                text: tagText,
                mentions: mentions
            }, { quoted: m });

            // Success reaction
            await sock.sendMessage(m.chat, { 
                react: { text: "✅", key: m.key } 
            });

        } catch (error) {
            console.error('Error in tagall command:', error);
            await sock.sendMessage(m.chat, { 
                react: { text: "❌", key: m.key } 
            });
            await reply("❌ Failed to tag all members. Please try again!");
        }
    }
};