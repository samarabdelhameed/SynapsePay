#!/usr/bin/env node

/**
 * سكريبت لإصلاح مشكلة الدفع - "Attempt to debit an account but found no record of a prior credit"
 */

const { Connection, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } = require('@solana/spl-token');

// إعدادات
const DEVNET_RPC = 'https://api.devnet.solana.com';
const USDC_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');

async function diagnosePaymentIssue(walletAddress) {
    console.log('🔍 تشخيص مشكلة الدفع...');
    console.log('📍 عنوان المحفظة:', walletAddress);
    console.log('🌐 الشبكة: Devnet');
    console.log('💰 عملة الدفع: USDC');
    console.log('');

    const connection = new Connection(DEVNET_RPC, 'confirmed');
    const wallet = new PublicKey(walletAddress);

    try {
        // 1. فحص رصيد SOL
        console.log('1️⃣ فحص رصيد SOL...');
        const solBalance = await connection.getBalance(wallet);
        const solAmount = solBalance / LAMPORTS_PER_SOL;
        
        console.log(`   💰 الرصيد: ${solAmount} SOL`);
        
        if (solAmount < 0.01) {
            console.log('   ❌ رصيد SOL غير كافي للمعاملات!');
            console.log('   💡 الحل: احصل على SOL من https://faucet.solana.com/');
            return false;
        } else {
            console.log('   ✅ رصيد SOL كافي');
        }

        // 2. فحص حساب USDC
        console.log('');
        console.log('2️⃣ فحص حساب USDC...');
        
        const usdcTokenAccount = await getAssociatedTokenAddress(USDC_MINT, wallet);
        console.log(`   📍 عنوان حساب USDC: ${usdcTokenAccount.toString()}`);

        try {
            const accountInfo = await connection.getAccountInfo(usdcTokenAccount);
            
            if (!accountInfo) {
                console.log('   ❌ حساب USDC غير موجود!');
                console.log('   💡 الحل: قم بإنشاء حساب USDC:');
                console.log('      spl-token create-account 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');
                return false;
            } else {
                console.log('   ✅ حساب USDC موجود');
            }

            // 3. فحص رصيد USDC
            console.log('');
            console.log('3️⃣ فحص رصيد USDC...');
            
            const tokenAccounts = await connection.getParsedTokenAccountsByOwner(wallet, {
                mint: USDC_MINT
            });

            if (tokenAccounts.value.length === 0) {
                console.log('   ❌ لا توجد حسابات USDC!');
                return false;
            }

            const usdcAccount = tokenAccounts.value[0];
            const usdcBalance = usdcAccount.account.data.parsed.info.tokenAmount.uiAmount;
            
            console.log(`   💵 رصيد USDC: ${usdcBalance} USDC`);
            
            if (usdcBalance < 0.1) {
                console.log('   ❌ رصيد USDC غير كافي للدفع!');
                console.log('   💡 الحل: احصل على USDC للاختبار من:');
                console.log('      - https://spl-token-faucet.com/');
                console.log('      - أو استخدم أمر: spl-token mint 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU 10');
                return false;
            } else {
                console.log('   ✅ رصيد USDC كافي');
            }

        } catch (error) {
            console.log('   ❌ خطأ في فحص حساب USDC:', error.message);
            return false;
        }

        // 4. فحص اتصال الشبكة
        console.log('');
        console.log('4️⃣ فحص اتصال الشبكة...');
        
        const latestBlockhash = await connection.getLatestBlockhash();
        console.log(`   🔗 آخر blockhash: ${latestBlockhash.blockhash.slice(0, 8)}...`);
        console.log('   ✅ الاتصال بالشبكة يعمل');

        console.log('');
        console.log('🎉 التشخيص مكتمل - المحفظة جاهزة للدفع!');
        return true;

    } catch (error) {
        console.error('❌ خطأ في التشخيص:', error.message);
        return false;
    }
}

// الحلول المقترحة
function printSolutions() {
    console.log('');
    console.log('🛠️  الحلول المقترحة:');
    console.log('');
    console.log('1️⃣ احصل على SOL للـ Devnet:');
    console.log('   curl -X POST "https://faucet.solana.com/api/v1/airdrop" \\');
    console.log('     -H "Content-Type: application/json" \\');
    console.log('     -d \'{"address":"YOUR_WALLET_ADDRESS","amount":2000000000}\'');
    console.log('');
    console.log('2️⃣ أنشئ حساب USDC:');
    console.log('   spl-token create-account 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');
    console.log('');
    console.log('3️⃣ احصل على USDC للاختبار:');
    console.log('   - اذهب إلى: https://spl-token-faucet.com/');
    console.log('   - أو استخدم: spl-token mint 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU 10');
    console.log('');
    console.log('4️⃣ تحقق من الرصيد:');
    console.log('   solana balance');
    console.log('   spl-token balance 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');
}

// تشغيل السكريبت
if (process.argv.length < 3) {
    console.log('الاستخدام: node fix-payment-error.js <wallet-address>');
    console.log('مثال: node fix-payment-error.js 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM');
    printSolutions();
} else {
    const walletAddress = process.argv[2];
    diagnosePaymentIssue(walletAddress).then(success => {
        if (!success) {
            printSolutions();
        }
    });
}