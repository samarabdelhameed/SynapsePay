#!/usr/bin/env node

/**
 * اختبار بسيط للمعاملات على Devnet
 */

const { Connection, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction, Keypair } = require('@solana/web3.js');

async function testTransaction() {
    console.log('🧪 اختبار المعاملة...');
    
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    
    // عنوان محفظتك
    const fromPubkey = new PublicKey('suquNVh2vQuQmc9Vd8f8vfWMhKGk2jExUjV8UCLCdd7');
    
    try {
        // فحص الرصيد
        const balance = await connection.getBalance(fromPubkey);
        console.log('💰 الرصيد:', balance / 1e9, 'SOL');
        
        // فحص آخر blockhash
        const { blockhash } = await connection.getLatestBlockhash();
        console.log('🔗 Blockhash:', blockhash.slice(0, 8) + '...');
        
        // فحص رسوم المعاملة المقدرة
        const testTx = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey,
                toPubkey: fromPubkey, // إرسال للنفس
                lamports: 1000, // 0.000001 SOL
            })
        );
        
        testTx.recentBlockhash = blockhash;
        testTx.feePayer = fromPubkey;
        
        const fee = await connection.getFeeForMessage(testTx.compileMessage());
        console.log('💸 رسوم المعاملة المقدرة:', fee.value / 1e9, 'SOL');
        
        if (balance < fee.value + 1000) {
            console.log('❌ الرصيد غير كافي للمعاملة');
        } else {
            console.log('✅ الرصيد كافي للمعاملة');
        }
        
        console.log('');
        console.log('📊 تفاصيل الشبكة:');
        console.log('   🌐 RPC: https://api.devnet.solana.com');
        console.log('   ⚡ الحالة: متصل');
        console.log('   🔄 Commitment: confirmed');
        
    } catch (error) {
        console.error('❌ خطأ في الاختبار:', error.message);
    }
}

testTransaction();