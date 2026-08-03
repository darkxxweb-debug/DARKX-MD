const { mongoose } = require('./db');

const voucherSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true, index: true }, // 14 digit code
    phone: { type: String, default: null }, // if set, voucher is locked to this number only
    maxConnections: { type: Number, default: 1 }, // how many times/numbers this voucher can pair
    usedConnections: { type: Number, default: 0 },
    durationDays: { type: Number, default: 30 }, // validity length chosen by admin
    expiresAt: { type: Date, required: true },
    active: { type: Boolean, default: true },
    createdBy: { type: String, default: 'admin' }
}, { timestamps: true });

voucherSchema.methods.isValid = function (phone) {
    if (!this.active) return { ok: false, reason: 'Voucher haijaruhusiwa (inactive).' };
    if (this.expiresAt && this.expiresAt.getTime() < Date.now()) return { ok: false, reason: 'Voucher imeisha muda (expired).' };
    if (this.usedConnections >= this.maxConnections) return { ok: false, reason: 'Voucher imefikia kikomo cha matumizi (limit reached).' };
    if (this.phone && phone && this.phone !== phone) return { ok: false, reason: 'Voucher hii ni ya namba nyingine.' };
    return { ok: true };
};

module.exports = mongoose.models.Voucher || mongoose.model('Voucher', voucherSchema);
