# احصل على رموز Devnet

## 1. احصل على SOL للـ Devnet

### الطريقة الأولى: Solana CLI
```bash
# تثبيت Solana CLI إذا لم يكن مثبتاً
curl -sSfL https://release.solana.com/v1.18.4/install | sh

# إعداد الشبكة على devnet
solana config set --url https://api.devnet.solana.com

# احصل على عنوان محفظتك
solana address

# احصل على SOL مجاني للـ devnet
solana airdrop 2
```

### الطريقة الثانية: Solana Faucet (الأسهل)
1. اذهب إلى: https://faucet.solana.com/
2. أدخل عنوان محفظتك
3. اختر "Devnet"
4. اضغط "Request Airdrop"

## 2. احصل على USDC للـ Devnet

### استخدام SPL Token Faucet
```bash
# إنشاء حساب USDC token
spl-token create-account 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU

# احصل على USDC للاختبار (يحتاج SOL أولاً)
# يمكنك استخدام برنامج mint للحصول على USDC للاختبار
```

### أو استخدم Devnet USDC Faucet
1. اذهب إلى: https://spl-token-faucet.com/
2. أدخل عنوان محفظتك
3. اختر USDC على Devnet
4. احصل على رموز للاختبار

## 3. تحقق من الرصيد

```bash
# تحقق من رصيد SOL
solana balance

# تحقق من رصيد USDC
spl-token balance 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
```

## عناوين مهمة للـ Devnet:
- **USDC Mint**: `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`
- **Solana RPC**: `https://api.devnet.solana.com`
- **Solana Explorer**: `https://explorer.solana.com/?cluster=devnet`