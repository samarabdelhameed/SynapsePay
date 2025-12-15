#!/usr/bin/env node

/**
 * سكريبت لإعداد محفظة Devnet مع USDC
 */

const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
const { getOrCreateAssociatedTokenAccount, mintTo, TOKEN_PROGRAM_ID } = require('@solana/spl-token');

// إعدادات Devnet
const DEVNET_RPC = 'https://api.devnet.solana.com';
const USDC_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');

async function setupWallet(walletAddress) {
    console.log('🚀 إعداد محفظة Devnet...');
    console.log('📍 عنوان المحفظة:', walletAddress);
    
    const connection = new Connection(DEVNET_RPC, 'confirmed');
    const wallet = new PublicKey(walletAddress);
    
    try {
        // 1. تحقق من رصيد SOL
        const solBalance = await connection.getBalance(wallet);
        console.log('💰 رصيد SOL:', solBalance / 1e9, 'SOL');
        
        if (solBalance < 0.1 * 1e9) {
            console.log('⚠️  رصيد SOL منخفض! احصل على SOL من:');
            console.log('   https://faucet.solana.com/');
            return;
        }
        
        // 2. تحقق من حساب USDC
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(wallet, {
            mint: USDC_MINT
        });
        
        if (tokenAccounts.value.length === 0) {
            console.log('❌ لا يوجد حساب USDC');
            console.log('💡 قم بإنشاء حساب USDC باستخدام:');
            console.log('   spl-token create-account 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');
        } else {
            const usdcAccount = tokenAccounts.value[0];
            const usdcBalance = usdcAccount.account.data.parsed.info.tokenAmount.uiAmount;
            console.log('💵 رصيد USDC:', usdcBalance, 'USDC');
            
            if (usdcBalance < 1) {
                console.log('⚠️  رصيد USDC منخفض!');
                console.log('💡 احصل على USDC للاختبار من:');
                console.log('   https://spl-token-faucet.com/');
            } else {
                console.log('✅ المحفظة جاهزة للاستخدام!');
            }
        }
        
    } catch (error) {
        console.error('❌ خطأ:', error.message);
    }
}

// استخدام السكريبت
if (process.argv.length < 3) {
    console.log('الاستخدام: node setup-wallet.js <wallet-address>');
    console.log('مثال: node setup-wallet.js 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM');
} else {
    const walletAddress = process.argv[2];
    setupWallet(walletAddress);
}