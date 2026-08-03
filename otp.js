const User = require('./User');
const { getSession } = require('./sessionManager');

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
}

/**
 * Sends a login OTP to the user's own WhatsApp number, using that same
 * number's already-connected bot session (so only whoever holds the phone
 * that WhatsApp is on can read the code).
 */
async function sendLoginOTP(phone) {
    const entry = getSession(phone);
    if (!entry) {
        return { ok: false, reason: 'Bot ya namba hii haijaunganishwa (not connected). Tafadhali pair kwanza.' };
    }

    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await User.updateOne(
        { phone },
        { $set: { otpCode: otp, otpExpiresAt } },
        { upsert: true }
    );

    try {
        await entry.sock.sendMessage(`${phone}@s.whatsapp.net`, {
            text: `🔐 *DARKX-MD Login*\n\nCode yako ya kuingia: *${otp}*\n\nCode hii itaisha muda baada ya dakika 5. Usimpe mtu yeyote.`
        });
        return { ok: true };
    } catch (err) {
        return { ok: false, reason: 'Imeshindikana kutuma OTP: ' + err.message };
    }
}

async function verifyOTP(phone, code) {
    const user = await User.findOne({ phone });
    if (!user || !user.otpCode) return { ok: false, reason: 'Hakuna OTP iliyoombwa.' };
    if (user.otpExpiresAt.getTime() < Date.now()) return { ok: false, reason: 'OTP imeisha muda.' };
    if (user.otpCode !== code) return { ok: false, reason: 'OTP si sahihi.' };

    user.otpCode = null;
    user.otpExpiresAt = null;
    user.lastLoginAt = new Date();
    await user.save();

    return { ok: true, user };
}

module.exports = { generateOTP, sendLoginOTP, verifyOTP };
