module.exports = {
    command: ['promote', 'demote', 'kick', 'add', 'del'],
    description: 'Group management commands',
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
                return await reply("❌ I need to be an admin to perform this action!");
            }

            // Check if user is admin or owner
            if (!isAdmins && !isGroupOwner && !isCreator) {
                return await reply("❌ Only group admins and owner can use this command!");
            }

            // Get the command used
            const cmd = m.text.trim().split(' ')[0].replace(prefix, '').toLowerCase();

            // Get target user
            let target = '';
            
            // Check if replying to a message
            if (m.quoted) {
                target = m.quoted.sender;
            } else {
                // Check if mention or number provided
                const mentioned = m.mentionedJid;
                if (mentioned && mentioned.length > 0) {
                    target = mentioned[0];
                } else if (args[0]) {
                    // Check if it's a phone number
                    let number = args[0].replace(/[^0-9]/g, '');
                    if (number.startsWith('0')) number = '255' + number.slice(1);
                    if (!number.startsWith('255')) number = '255' + number;
                    target = number + '@s.whatsapp.net';
                }
            }

            // Validate target
            if (!target) {
                return await reply(`❌ Please mention a user, reply to their message, or provide a phone number!\n\n📝 Example:\n${prefix}promote @user\n${prefix}kick 2557xxxxxx`);
            }

            // Check if target is bot
            const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            if (target === botNumber) {
                return await reply("❌ I cannot perform actions on myself!");
            }

            // Check if target is group owner
            if (target === groupOwner) {
                return await reply("❌ Cannot perform actions on group owner!");
            }

            // Check if target is in group
            const isMember = participants.some(p => p.id === target);
            if (!isMember && cmd !== 'add') {
                return await reply("❌ User is not in this group!");
            }

            // Handle different commands
            switch (cmd) {
                case 'promote':
                    // Check if target is already admin
                    const isAlreadyAdmin = groupAdmins.includes(target);
                    if (isAlreadyAdmin) {
                        return await reply("❌ User is already an admin!");
                    }
                    
                    await sock.groupParticipantsUpdate(m.chat, [target], 'promote');
                    await sock.sendMessage(m.chat, { 
                        react: { text: "✅", key: m.key } 
                    });
                    await reply(`✅ *Promoted Successfully!*\n\n👤 @${target.split('@')[0]} is now a group admin!\n\n👑 DARKX ULTRA Group Manager`, { mentions: [target] });
                    break;

                case 'demote':
                    // Check if target is admin
                    const isAdmin = groupAdmins.includes(target);
                    if (!isAdmin) {
                        return await reply("❌ User is not an admin!");
                    }
                    
                    await sock.groupParticipantsUpdate(m.chat, [target], 'demote');
                    await sock.sendMessage(m.chat, { 
                        react: { text: "✅", key: m.key } 
                    });
                    await reply(`✅ *Demoted Successfully!*\n\n👤 @${target.split('@')[0]} is no longer a group admin.\n\n👑 DARKX ULTRA Group Manager`, { mentions: [target] });
                    break;

                case 'kick':
                case 'del':
                    // Check if target is admin (can't kick admin)
                    const isTargetAdmin = groupAdmins.includes(target);
                    if (isTargetAdmin && !isCreator) {
                        return await reply("❌ You cannot kick an admin!");
                    }
                    
                    await sock.groupParticipantsUpdate(m.chat, [target], 'remove');
                    await sock.sendMessage(m.chat, { 
                        react: { text: "✅", key: m.key } 
                    });
                    await reply(`✅ *Removed Successfully!*\n\n👤 @${target.split('@')[0]} has been removed from the group.\n\n👑 DARKX ULTRA Group Manager`, { mentions: [target] });
                    break;

                case 'add':
                    // Check if user is already in group
                    const isAlreadyMember = participants.some(p => p.id === target);
                    if (isAlreadyMember) {
                        return await reply("❌ User is already in this group!");
                    }
                    
                    await sock.groupParticipantsUpdate(m.chat, [target], 'add');
                    await sock.sendMessage(m.chat, { 
                        react: { text: "✅", key: m.key } 
                    });
                    await reply(`✅ *Added Successfully!*\n\n👤 @${target.split('@')[0]} has been added to the group.\n\n👑 DARKX ULTRA Group Manager`, { mentions: [target] });
                    break;

                default:
                    await reply("❌ Invalid command!");
            }

        } catch (error) {
            console.error('Error in group management:', error);
            await sock.sendMessage(m.chat, { 
                react: { text: "❌", key: m.key } 
            });
            
            // Handle specific errors
            if (error.message?.includes('not-authorized')) {
                await reply("❌ I need to be an admin to perform this action!");
            } else if (error.message?.includes('participant')) {
                await reply("❌ Failed to perform action. Please check the target user.");
            } else {
                await reply("❌ Failed to perform action. Please try again!");
            }
        }
    }
};