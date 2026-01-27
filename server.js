// server.js (Node.js + Express)
const express = require('express');
const { Connection, Keypair, PublicKey } = require('@solana/web3.js');
const { getOrCreateAssociatedTokenAccount, transfer } = require('@solana/spl-token');

const app = express();
app.use(express.json());

// Your treasury wallet (KEEP SECRET!)
const TREASURY_SECRET = [/* your private key array */];
const TOKEN_MINT = '8Jx8AAHj86wbQgUTjGuj6GTTL5Ps3cqxKRTvpaJApump';

const connection = new Connection('https://rpc.ankr.com/solana');
const treasury = Keypair.fromSecretKey(new Uint8Array(TREASURY_SECRET));

// Simple database (use real DB in production)
const claims = new Map();

app.post('/api/claim', async (req, res) => {
    const { wallet, amount } = req.body;
    
    // Validate
    if (!wallet || !amount || amount <= 0) {
        return res.json({ success: false, error: 'Invalid request' });
    }
    
    // Rate limit (1 claim per hour)
    const lastClaim = claims.get(wallet);
    if (lastClaim && Date.now() - lastClaim < 3600000) {
        return res.json({ success: false, error: 'Please wait before claiming again' });
    }
    
    try {
        // Get token accounts
        const mintPubkey = new PublicKey(TOKEN_MINT);
        const recipientPubkey = new PublicKey(wallet);
        
        const treasuryTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection, treasury, mintPubkey, treasury.publicKey
        );
        
        const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection, treasury, mintPubkey, recipientPubkey
        );
        
        // Transfer tokens (amount in smallest units)
        const decimals = 6; // Check your token's decimals
        const transferAmount = amount * Math.pow(10, decimals);
        
        const signature = await transfer(
            connection,
            treasury,
            treasuryTokenAccount.address,
            recipientTokenAccount.address,
            treasury,
            transferAmount
        );
        
        claims.set(wallet, Date.now());
        
        res.json({ success: true, signature });
    } catch (error) {
        console.error('Transfer error:', error);
        res.json({ success: false, error: 'Transfer failed' });
    }
});

app.listen(3000, () => console.log('Server running on port 3000'));