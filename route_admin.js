const express = require('express');
const crypto = require('crypto');
const router = express.Router();

const Voucher = require('./Voucher');
const Session = require('./Session');
const { requireAdmin } = require('./auth');

function generateVoucherCode() {
    // 14 digit numeric voucher code
    let code = '';
    for (let i = 0; i < 14; i++) code += crypto.randomInt(0, 10);
    return code;
}

router.get('/login', (req, res) => {
    res.render('admin_login', { botName: 'DARKX-MD', error: null });
});

router.post('/login', (req, res) => {
    const { password } = req.body;
    if (password && password === process.env.ADMIN_PASSWORD) {
        req.session.isAdmin = true;
        return res.redirect('/admin/dashboard');
    }
    return res.render('admin_login', { botName: 'DARKX-MD', error: 'Password si sahihi.' });
});

router.post('/logout', requireAdmin, (req, res) => {
    req.session.destroy(() => res.redirect('/admin/login'));
});

router.get('/dashboard', requireAdmin, async (req, res) => {
    const vouchers = await Voucher.find().sort({ createdAt: -1 }).limit(100);
    const sessions = await Session.find().sort({ createdAt: -1 }).limit(100);
    res.render('admin_dashboard', { botName: 'DARKX-MD', vouchers, sessions, created: null });
});

router.post('/vouchers', requireAdmin, async (req, res) => {
    const { phone, maxConnections, durationDays } = req.body;
    const code = generateVoucherCode();
    const days = Math.max(1, parseInt(durationDays, 10) || 30);
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const voucher = await Voucher.create({
        code,
        phone: phone ? String(phone).replace(/[^0-9]/g, '') : null,
        maxConnections: Math.max(1, parseInt(maxConnections, 10) || 1),
        durationDays: days,
        expiresAt
    });

    const vouchers = await Voucher.find().sort({ createdAt: -1 }).limit(100);
    const sessions = await Session.find().sort({ createdAt: -1 }).limit(100);
    res.render('admin_dashboard', { botName: 'DARKX-MD', vouchers, sessions, created: voucher.code });
});

router.post('/vouchers/:id/toggle', requireAdmin, async (req, res) => {
    const voucher = await Voucher.findById(req.params.id);
    if (voucher) {
        voucher.active = !voucher.active;
        await voucher.save();
    }
    res.redirect('/admin/dashboard');
});

router.post('/vouchers/:id/delete', requireAdmin, async (req, res) => {
    await Voucher.findByIdAndDelete(req.params.id);
    res.redirect('/admin/dashboard');
});

module.exports = router;
