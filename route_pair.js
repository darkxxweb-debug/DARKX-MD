const express = require('express');
const router = express.Router();

const Voucher = require('./Voucher');
const Session = require('./Session');
const { startSession } = require('./sessionManager');

function cleanPhone(raw) {
    return String(raw || '').replace(/[^0-9]/g, '');
}

function withTimeout(promise, ms) {
    return Promise.race([
        promise,
        new Promise((resolve) => setTimeout(() => resolve(null), ms))
    ]);
}

router.get('/pair', (req, res) => {
    res.render('pair', { botName: 'DARKX-MD' });
});

router.post('/pair/connect', async (req, res) => {
    try {
        const phone = cleanPhone(req.body.phone);
        const voucherCode = String(req.body.voucher || '').trim();

        if (!phone || phone.length < 9) {
            return res.json({ ok: false, message: 'Weka namba sahihi ya WhatsApp (mfano: 2557XXXXXXXX).' });
        }
        if (!voucherCode) {
            return res.json({ ok: false, message: 'Weka voucher code.' });
        }

        const voucher = await Voucher.findOne({ code: voucherCode });
        if (!voucher) {
            return res.json({ ok: false, message: 'Voucher haipo au si sahihi.' });
        }

        const check = voucher.isValid(phone);
        if (!check.ok) {
            return res.json({ ok: false, message: check.reason });
        }

        await Session.updateOne(
            { phone },
            { $set: { voucherCode, status: 'pending' } },
            { upsert: true }
        );

        const pairingCode = await withTimeout(new Promise((resolve) => {
            startSession(phone, {
                onPairingCode: (code) => resolve(code),
                onStatus: () => {}
            }).catch((err) => {
                console.error(`[pair:${phone}] startSession failed:`, err);
                resolve(null);
            });
        }), 25000);

        if (!pairingCode) {
            console.error(`[pair:${phone}] no pairing code after 25s (timed out or request never resolved — likely WhatsApp blocking this server's IP, or Mongo/network issue upstream).`);
            return res.json({ ok: false, message: 'Imeshindikana kupata pairing code. Hakikisha namba iko sahihi kisha jaribu tena.' });
        }

        voucher.usedConnections += 1;
        if (voucher.usedConnections >= voucher.maxConnections) voucher.active = false;
        await voucher.save();

        return res.json({ ok: true, pairingCode });
    } catch (err) {
        console.error(err);
        return res.json({ ok: false, message: 'Hitilafu ya server: ' + err.message });
    }
});

module.exports = router;
