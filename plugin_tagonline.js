module.exports = {
    command: 'tagonline',
    description: 'Tag all online group members',
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

            // Send processing message
            await sock.sendMessage(m.chat, { 
                react: { text: "🔍", key: m.key } 
            });

            // Get all group participants
            const groupMembers = participants.map(p => p.id);
            
            // Get online status for each member
            const onlineMembers = [];
            const offlineMembers = [];
            const unknownMembers = [];

            for (const jid of groupMembers) {
                try {
                    // Check presence status
                    const presence = await sock.presenceSubscribe(jid);
                    
                    // Try to get user's presence
                    // Note: This is a simplified check - actual presence detection may vary
                    const status = await sock.getUserPresence(jid).catch(() => null);
                    
                    if (status === 'available' || status === 'composing' || status === 'recording') {
                        onlineMembers.push(jid);
                    } else if (status === 'unavailable') {
                        offlineMembers.push(jid);
                    } else {
                        unknownMembers.push(jid);
                    }
                } catch (error) {
                    // If can't get presence, consider as unknown
                    unknownMembers.push(jid);
                }
            }

            // Get message to tag with
            const tagMessage = text || "📢 Online members!";

            // If no online members found
            if (onlineMembers.length === 0) {
                await sock.sendMessage(m.chat, { 
                    react: { text: "😴", key: m.key } 
                });
                return await reply("😴 No online members found in this group right now!");
            }

            // Create tag message
            let tagText = `🟢 *ONLINE MEMBERS*\n\n📝 Message: ${tagMessage}\n\n👤 Online (${onlineMembers.length}):\n`;
            
            // Add online members with numbers
            onlineMembers.forEach((jid, index) => {
                const number = jid.split('@')[0];
                tagText += `${index + 1}. @${number}\n`;
            });

            // Add offline members count if any
            if (offlineMembers.length > 0) {
                tagText += `\n⚫ Offline: ${offlineMembers.length} members`;
            }

            // Add unknown members count if any
            if (unknownMembers.length > 0) {
                tagText += `\n❓ Unknown: ${unknownMembers.length} members`;
            }

            tagText += `\n\n💀 DARKX ULTRA Tag Online`;

            // Send message with mentions
            await sock.sendMessage(m.chat, {
                text: tagText,
                mentions: onlineMembers
            }, { quoted: m });

            // Success reaction
            await sock.sendMessage(m.chat, { 
                react: { text: "✅", key: m.key } 
            });

        } catch (error) {
            console.error('Error in tagonline command:', error);
            await sock.sendMessage(m.chat, { 
                react: { text: "❌", key: m.key } 
            });
            await reply("❌ Failed to tag online members. Please try again!");
        }
    }
};