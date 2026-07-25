// server.js (Node.js + Express)
const express = require('express');

const app = express();
app.use(express.json());

// Simple in-memory claim queue. Connect this to your Robinhood Chain rewards service when ready.
const claims = new Map();

app.post('/api/claim', (req, res) => {
    const { wallet, amount } = req.body;

    if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet) || !amount || amount <= 0) {
        return res.json({ success: false, error: 'Invalid request' });
    }

    const lastClaim = claims.get(wallet.toLowerCase());
    if (lastClaim && Date.now() - lastClaim < 3600000) {
        return res.json({ success: false, error: 'Please wait before claiming again' });
    }

    claims.set(wallet.toLowerCase(), Date.now());
    res.json({
        success: true,
        status: 'queued',
        message: 'Reward claim queued for Robinhood Chain distribution.'
    });
});

app.listen(3000, () => console.log('Server running on port 3000'));