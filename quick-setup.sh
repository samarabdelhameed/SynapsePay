#!/bin/bash

# سكريبت سريع لإعداد محفظة Devnet مع USDC

echo "🚀 إعداد محفظة SynapsePay على Devnet"
echo "=================================="

# التحقق من تثبيت Solana CLI
if ! command -v solana &> /dev/null; then
    echo "❌ Solana CLI غير مثبت"
    echo "💡 قم بتثبيته من: https://docs.solana.com/cli/install-solana-cli-tools"
    exit 1
fi

# التحقق من تثبيت SPL Token CLI
if ! command -v spl-token &> /dev/null; then
    echo "❌ SPL Token CLI غير مثبت"
    echo "💡 قم بتثبيته باستخدام: cargo install spl-token-cli"
    exit 1
fi

echo "✅ أدوات Solana مثبتة"

# إعداد الشبكة على devnet
echo "🌐 إعداد الشبكة على Devnet..."
solana config set --url https://api.devnet.solana.com

# عرض عنوان المحفظة
WALLET_ADDRESS=$(solana address)
echo "📍 عنوان المحفظة: $WALLET_ADDRESS"

# فحص رصيد SOL
SOL_BALANCE=$(solana balance --lamports)
SOL_AMOUNT=$(echo "scale=4; $SOL_BALANCE / 1000000000" | bc -l)

echo "💰 رصيد SOL الحالي: $SOL_AMOUNT SOL"

# طلب SOL إذا كان الرصيد منخفض
if (( $(echo "$SOL_AMOUNT < 0.1" | bc -l) )); then
    echo "⚠️  رصيد SOL منخفض، جاري طلب airdrop..."
    solana airdrop 2
    echo "✅ تم الحصول على 2 SOL"
else
    echo "✅ رصيد SOL كافي"
fi

# إنشاء حساب USDC إذا لم يكن موجود
USDC_MINT="4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
echo "🪙 فحص حساب USDC..."

# محاولة الحصول على رصيد USDC
USDC_BALANCE=$(spl-token balance $USDC_MINT 2>/dev/null || echo "0")

if [ "$USDC_BALANCE" = "0" ] || [ -z "$USDC_BALANCE" ]; then
    echo "📝 إنشاء حساب USDC..."
    spl-token create-account $USDC_MINT
    echo "✅ تم إنشاء حساب USDC"
    
    echo "💵 الحصول على USDC للاختبار..."
    echo "⚠️  يجب الحصول على USDC يدوياً من:"
    echo "   - https://spl-token-faucet.com/"
    echo "   - أو استخدم: spl-token mint $USDC_MINT 10 (إذا كان لديك صلاحية mint)"
else
    echo "✅ حساب USDC موجود - الرصيد: $USDC_BALANCE USDC"
fi

echo ""
echo "🎉 الإعداد مكتمل!"
echo ""
echo "📋 ملخص المحفظة:"
echo "   📍 العنوان: $WALLET_ADDRESS"
echo "   💰 SOL: $(solana balance)"
echo "   💵 USDC: $(spl-token balance $USDC_MINT 2>/dev/null || echo 'غير متوفر')"
echo ""
echo "🔗 روابط مفيدة:"
echo "   - Solana Explorer: https://explorer.solana.com/address/$WALLET_ADDRESS?cluster=devnet"
echo "   - USDC Faucet: https://spl-token-faucet.com/"
echo "   - SOL Faucet: https://faucet.solana.com/"
echo ""
echo "✅ يمكنك الآن استخدام SynapsePay!"