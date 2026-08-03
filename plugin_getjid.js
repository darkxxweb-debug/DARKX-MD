module.exports = {
    command: 'jid',
    category: 'tools',
    description: 'Get WhatsApp channel newsletter JID',
    
    async execute(sock, m, { args, reply }) {
        try {
            if (!args[0]) {
                return reply('❌ Toa link ya channel\n\nMfano:\n.jid https://whatsapp.com/channel/xxxx');
            }

            let link = args[0];

            // Extract invite code kutoka link
            let inviteCode = link.split('/').pop();

            if (!inviteCode || inviteCode.length < 10) {
                return reply('❌ Link sio sahihi');
            }

            // Fetch metadata
            const data = await sock.newsletterMetadata(inviteCode);

            let result = `
╔═〘 📡 CHANNEL INFO 〙
║ 📛 Name: ${data.name || 'Unknown'}
║ 🆔 JID: ${data.id}
║ 👥 Subscribers: ${data.subscribers || 'N/A'}
║ 📝 Description: ${data.description || 'None'}
╚═══════════════`;

            reply(result);

        } catch (err) {
            reply('❌ Imeshindikana kupata JID\nHakikisha:\n- Link ipo sahihi\n- Umejoin channel');
            console.log(err);
        }
    }
};