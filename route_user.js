const express = require('express');
const router = express.Router();

const User = require('./User');
const { sendLoginOTP, verifyOTP } = require('./otp');
const { getSession } = require('./sessionManager');
const { requireUser } = require('./auth');

function cleanPhone(raw) {
    return String(raw || '').replace(/[^0-9]/g, '');
}

router.get('/login', (req, res) => {
    res.render('user_login', { botName: 'DARKX-MD', error: null });
});

router.post('/login', async (req, res) => {
    const phone = cleanPhone(req.body.phone);
    if (!phone) return res.render('user_login', { botName: 'DARKX-MD', error: 'Weka namba sahihi.' });

    const result = await sendLoginOTP(phone);
    if (!result.ok) return res.render('user_login', { botName: 'DARKX-MD', error: result.reason });

    req.session.pendingPhone = phone;
    res.redirect('/user/otp');
});

router.get('/otp', (req, res) => {
    if (!req.session.pendingPhone) return res.redirect('/user/login');
    res.render('user_otp', { botName: 'DARKX-MD', error: null, phone: req.session.pendingPhone });
});

router.post('/otp', async (req, res) => {
    const phone = req.session.pendingPhone;
    if (!phone) return res.redirect('/user/login');

    const code = String(req.body.code || '').trim();
    const result = await verifyOTP(phone, code);
    if (!result.ok) return res.render('user_otp', { botName: 'DARKX-MD', error: result.reason, phone });

    delete req.session.pendingPhone;
    req.session.userPhone = phone;
    res.redirect('/user/settings');
});

router.get('/settings', requireUser, async (req, res) => {
    const user = await User.findOne({ phone: req.session.userPhone });
    res.render('settings', { botName: 'DARKX-MD', user, saved: false });
});

router.post('/settings', requireUser, async (req, res) => {
    const phone = req.session.userPhone;
    const { botNameInput, prefix, publicMode, autoRead, autoStatusView, antidelete, welcomeMessage } = req.body;

    const update = {
        'settings.botName': botNameInput || 'DARKX-MD',
        'settings.prefix': (prefix || '.').slice(0, 3),
        'settings.publicMode': publicMode === 'on',
        'settings.autoRead': autoRead === 'on',
        'settings.autoStatusView': autoStatusView === 'on',
        'settings.antidelete': antidelete === 'on',
        'settings.welcomeMessage': welcomeMessage || 'Welcome!'
    };

    const user = await User.findOneAndUpdate({ phone }, { $set: update }, { new: true, upsert: true });

    // Apply live if the session is currently connected
    const entry = getSession(phone);
    if (entry) {
        entry.sock.settings = user.settings;
        entry.sock.public = user.settings.publicMode !== false;
    }

    res.render('settings', { botName: 'DARKX-MD', user, saved: true });
});

router.post('/logout', requireUser, (req, res) => {
    req.session.destroy(() => res.redirect('/user/login'));
});

module.exports = router;
