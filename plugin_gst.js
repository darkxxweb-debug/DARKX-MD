module.exports = {
    command: 'gst',
    description: 'Set or change group status/description',
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
                return await reply("❌ I need to be an admin to change group status!");
            }

            // Check if user is admin or owner
            if (!isAdmins && !isGroupOwner && !isCreator) {
                return await reply("❌ Only group admins and owner can change group status!");
            }

            // Check if status text is provided
            if (!text) {
                const currentStatus = groupMetadata?.desc || 'No status set';
                return await reply(`📋 *Current Group Status*\n\n${currentStatus}\n\n📝 To change:\n${prefix}gst <new status>`);
            }

            // Update group description/status
            await sock.groupUpdateDescription(m.chat, text);

            // Success reaction
            await sock.sendMessage(m.chat, { 
                react: { text: "✅", key: m.key } 
            });

            // Send confirmation
            await sock.sendMessage(m.chat, {
                text: `✅ *Group Status Updated!*\n\n📝 New Status:\n${text}\n\n👑 Updated by: @${sender.split('@')[0]}\n\n💀 DARKX ULTRA Group Manager`,
                mentions: [sender]
            }, { quoted: m });

        } catch (error) {
            console.error('Error in gst command:', error);
            await sock.sendMessage(m.chat, { 
                react: { text: "❌", key: m.key } 
            });
            
            // Handle specific errors
            if (error.message?.includes('not-authorized')) {
                await reply("❌ I need to be an admin to change group status!");
            } else if (error.message?.includes('too-long')) {
                await reply("❌ Status is too long! Please keep it under 500 characters.");
            } else {
                await reply("❌ Failed to update group status. Please try again!");
            }
        }
    }
};