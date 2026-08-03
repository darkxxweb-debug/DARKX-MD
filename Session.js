const { mongoose } = require('./db');

const sessionSchema = new mongoose.Schema({
    phone: { type: String, required: true, unique: true, index: true },
    creds: { type: mongoose.Schema.Types.Mixed, default: null },
    keys: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: { type: String, enum: ['pending', 'connected', 'disconnected'], default: 'pending' },
    voucherCode: { type: String, default: null },
    connectedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.models.Session || mongoose.model('Session', sessionSchema);
