const { mongoose } = require('./db');

const userSchema = new mongoose.Schema({
    phone: { type: String, required: true, unique: true, index: true },

    // OTP based login (code is sent to the user's own WhatsApp via their connected session)
    otpCode: { type: String, default: null },
    otpExpiresAt: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },

    // Per-user customizable bot settings, applied to their own session
    settings: {
        botName: { type: String, default: 'DARKX-MD' },
        prefix: { type: String, default: '.' },
        publicMode: { type: Boolean, default: true },
        autoRead: { type: Boolean, default: false },
        autoStatusView: { type: Boolean, default: true },
        antidelete: { type: Boolean, default: false },
        welcomeMessage: { type: String, default: 'Welcome!' }
    }
}, { timestamps: true });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
