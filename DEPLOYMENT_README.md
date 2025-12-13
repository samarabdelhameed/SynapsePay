# SynapsePay - معلومات النشر على Devnet

## نظرة عامة
تم نشر جميع عقود SynapsePay بنجاح على شبكة Solana Devnet.

## العقود المنشورة

### synapsepay-registry
- **Program ID**: `5w8vTt1AUo67nE9bWA5e9Sh28HXtJJZaqiPj53n6wcby`
- **Explorer**: [عرض على Solana Explorer](https://explorer.solana.com/address/5w8vTt1AUo67nE9bWA5e9Sh28HXtJJZaqiPj53n6wcby?cluster=devnet)
- **SolScan**: [عرض على SolScan](https://solscan.io/account/5w8vTt1AUo67nE9bWA5e9Sh28HXtJJZaqiPj53n6wcby?cluster=devnet)
- **الحالة**: ✅ منشور على devnet

### synapsepay-payments
- **Program ID**: `8yzR2Ze7t8NjH9b9wUUaUxkHLcrfogWqAzqbMSb1vZgP`
- **Explorer**: [عرض على Solana Explorer](https://explorer.solana.com/address/8yzR2Ze7t8NjH9b9wUUaUxkHLcrfogWqAzqbMSb1vZgP?cluster=devnet)
- **SolScan**: [عرض على SolScan](https://solscan.io/account/8yzR2Ze7t8NjH9b9wUUaUxkHLcrfogWqAzqbMSb1vZgP?cluster=devnet)
- **الحالة**: ✅ منشور على devnet

### synapsepay-scheduler
- **Program ID**: `8NWxX7CDYhpfWAG5Dd6UJQ4EU1Ykrid8CoJ48Kp8MjsY`
- **Explorer**: [عرض على Solana Explorer](https://explorer.solana.com/address/8NWxX7CDYhpfWAG5Dd6UJQ4EU1Ykrid8CoJ48Kp8MjsY?cluster=devnet)
- **SolScan**: [عرض على SolScan](https://solscan.io/account/8NWxX7CDYhpfWAG5Dd6UJQ4EU1Ykrid8CoJ48Kp8MjsY?cluster=devnet)
- **الحالة**: ✅ منشور على devnet

## معلومات الشبكة
- **الشبكة**: Solana Devnet
- **RPC URL**: https://api.devnet.solana.com
- **WebSocket URL**: wss://api.devnet.solana.com
- **تاريخ النشر**: $(date)

## كيفية التفاعل مع العقود

### 1. إعداد البيئة
```bash
# تأكد من أنك على devnet
solana config set --url devnet

# تحقق من الإعدادات
solana config get
```

### 2. عرض معلومات العقد
```bash
# عرض معلومات عقد Registry
solana program show 5w8vTt1AUo67nE9bWA5e9Sh28HXtJJZaqiPj53n6wcby

# عرض معلومات عقد Payments
solana program show 8yzR2Ze7t8NjH9b9wUUaUxkHLcrfogWqAzqbMSb1vZgP

# عرض معلومات عقد Scheduler
solana program show 8NWxX7CDYhpfWAG5Dd6UJQ4EU1Ykrid8CoJ48Kp8MjsY
```

### 3. متغيرات البيئة
أضف هذه المتغيرات لملف `.env`:

```env
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
SYNAPSEPAY_REGISTRY_PROGRAM_ID=5w8vTt1AUo67nE9bWA5e9Sh28HXtJJZaqiPj53n6wcby
SYNAPSEPAY_PAYMENTS_PROGRAM_ID=8yzR2Ze7t8NjH9b9wUUaUxkHLcrfogWqAzqbMSb1vZgP
SYNAPSEPAY_SCHEDULER_PROGRAM_ID=8NWxX7CDYhpfWAG5Dd6UJQ4EU1Ykrid8CoJ48Kp8MjsY
```

## اختبار العقود

### Registry Contract
```typescript
import { PublicKey } from '@solana/web3.js';

const REGISTRY_PROGRAM_ID = new PublicKey('5w8vTt1AUo67nE9bWA5e9Sh28HXtJJZaqiPj53n6wcby');
// استخدم هذا المعرف للتفاعل مع عقد Registry
```

### Payments Contract
```typescript
import { PublicKey } from '@solana/web3.js';

const PAYMENTS_PROGRAM_ID = new PublicKey('8yzR2Ze7t8NjH9b9wUUaUxkHLcrfogWqAzqbMSb1vZgP');
// استخدم هذا المعرف للتفاعل مع عقد Payments
```

### Scheduler Contract
```typescript
import { PublicKey } from '@solana/web3.js';

const SCHEDULER_PROGRAM_ID = new PublicKey('8NWxX7CDYhpfWAG5Dd6UJQ4EU1Ykrid8CoJ48Kp8MjsY');
// استخدم هذا المعرف للتفاعل مع عقد Scheduler
```

## الأمان والتحقق

### التحقق من صحة العقود
يمكنك التحقق من صحة العقود من خلال:

1. **Solana Explorer**: عرض كود المصدر والمعاملات
2. **SolScan**: تحليل مفصل للعقود
3. **RPC Calls**: التحقق المباشر من الشبكة

### نصائح الأمان
- تأكد دائماً من Program IDs قبل التفاعل
- استخدم devnet للاختبار فقط
- احفظ نسخة احتياطية من المفاتيح الخاصة
- تحقق من الروابط قبل الاستخدام

## الدعم والمساعدة

إذا واجهت أي مشاكل:
1. تحقق من حالة الشبكة: [Solana Status](https://status.solana.com/)
2. راجع الوثائق: [Solana Docs](https://docs.solana.com/)
3. استخدم Solana Discord للدعم المجتمعي

---

**تم إنشاء هذا الملف تلقائياً في**: $(date)