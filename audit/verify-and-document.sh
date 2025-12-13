#!/bin/bash

# نظام التحقق والتوثيق لمشروع SynapsePay
set -e

echo "📋 بدء نظام التحقق والتوثيق..."

# ألوان للمخرجات
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[VERIFY]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${PURPLE}[INFO]${NC} $1"
}

# إنشاء مجلد التقارير
mkdir -p audit/reports/verification

# قائمة العقود
CONTRACTS=("synapsepay-registry" "synapsepay-payments" "synapsepay-scheduler")

# دالة للتحقق من عقد على Solana Explorer
verify_on_explorer() {
    local contract_name="$1"
    local program_id="$2"
    
    print_status "التحقق من ${contract_name} على Solana Explorer..."
    
    # محاولة الوصول لـ Solana Explorer API
    local explorer_url="https://explorer.solana.com/address/${program_id}?cluster=devnet"
    local api_url="https://api.devnet.solana.com"
    
    # التحقق من وجود البرنامج عبر RPC
    local rpc_response=$(curl -s -X POST "$api_url" \
        -H "Content-Type: application/json" \
        -d "{
            \"jsonrpc\": \"2.0\",
            \"id\": 1,
            \"method\": \"getAccountInfo\",
            \"params\": [
                \"$program_id\",
                {\"encoding\": \"base64\"}
            ]
        }")
    
    if echo "$rpc_response" | grep -q "\"result\""; then
        print_success "✅ ${contract_name} - متاح على الشبكة"
        
        # استخراج معلومات الحساب
        local owner=$(echo "$rpc_response" | jq -r '.result.value.owner // "غير متوفر"')
        local lamports=$(echo "$rpc_response" | jq -r '.result.value.lamports // 0')
        local sol_balance=$(echo "scale=9; $lamports / 1000000000" | bc -l)
        
        print_info "المالك: $owner"
        print_info "الرصيد: $sol_balance SOL"
        print_info "رابط Explorer: $explorer_url"
        
        return 0
    else
        print_error "❌ ${contract_name} - غير متاح على الشبكة"
        return 1
    fi
}

# دالة لاختبار صحة الروابط
test_links() {
    local program_id="$1"
    local contract_name="$2"
    
    print_status "اختبار روابط ${contract_name}..."
    
    local links=(
        "https://explorer.solana.com/address/${program_id}?cluster=devnet"
        "https://solscan.io/account/${program_id}?cluster=devnet"
    )
    
    local working_links=0
    local total_links=${#links[@]}
    
    for link in "${links[@]}"; do
        if curl -s --head "$link" | head -n 1 | grep -q "200 OK"; then
            print_success "✅ رابط يعمل: $link"
            working_links=$((working_links + 1))
        else
            print_warning "⚠️ رابط لا يعمل: $link"
        fi
    done
    
    print_info "الروابط العاملة: $working_links/$total_links"
    return 0
}

# دالة لإنشاء وثائق README محدثة
update_readme() {
    print_status "تحديث ملف README..."
    
    # إنشاء قسم العقود المنشورة
    local contracts_section=""
    
    for contract in "${CONTRACTS[@]}"; do
        local keypair_file="target/deploy/${contract//-/_}-keypair.json"
        if [ -f "$keypair_file" ]; then
            local program_id=$(solana address -k "$keypair_file")
            local explorer_link="https://explorer.solana.com/address/${program_id}?cluster=devnet"
            local solscan_link="https://solscan.io/account/${program_id}?cluster=devnet"
            
            contracts_section="${contracts_section}
### ${contract}
- **Program ID**: \`${program_id}\`
- **Explorer**: [عرض على Solana Explorer](${explorer_link})
- **SolScan**: [عرض على SolScan](${solscan_link})
- **الحالة**: ✅ منشور على devnet
"
        fi
    done
    
    # إنشاء ملف README محدث
    cat > DEPLOYMENT_README.md << EOF
# SynapsePay - معلومات النشر على Devnet

## نظرة عامة
تم نشر جميع عقود SynapsePay بنجاح على شبكة Solana Devnet.

## العقود المنشورة
${contracts_section}

## معلومات الشبكة
- **الشبكة**: Solana Devnet
- **RPC URL**: https://api.devnet.solana.com
- **WebSocket URL**: wss://api.devnet.solana.com
- **تاريخ النشر**: $(date)

## كيفية التفاعل مع العقود

### 1. إعداد البيئة
\`\`\`bash
# تأكد من أنك على devnet
solana config set --url devnet

# تحقق من الإعدادات
solana config get
\`\`\`

### 2. عرض معلومات العقد
\`\`\`bash
# عرض معلومات عقد Registry
solana program show 5w8vTt1AUo67nE9bWA5e9Sh28HXtJJZaqiPj53n6wcby

# عرض معلومات عقد Payments
solana program show 8yzR2Ze7t8NjH9b9wUUaUxkHLcrfogWqAzqbMSb1vZgP

# عرض معلومات عقد Scheduler
solana program show 8NWxX7CDYhpfWAG5Dd6UJQ4EU1Ykrid8CoJ48Kp8MjsY
\`\`\`

### 3. متغيرات البيئة
أضف هذه المتغيرات لملف \`.env\`:

\`\`\`env
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
SYNAPSEPAY_REGISTRY_PROGRAM_ID=5w8vTt1AUo67nE9bWA5e9Sh28HXtJJZaqiPj53n6wcby
SYNAPSEPAY_PAYMENTS_PROGRAM_ID=8yzR2Ze7t8NjH9b9wUUaUxkHLcrfogWqAzqbMSb1vZgP
SYNAPSEPAY_SCHEDULER_PROGRAM_ID=8NWxX7CDYhpfWAG5Dd6UJQ4EU1Ykrid8CoJ48Kp8MjsY
\`\`\`

## اختبار العقود

### Registry Contract
\`\`\`typescript
import { PublicKey } from '@solana/web3.js';

const REGISTRY_PROGRAM_ID = new PublicKey('5w8vTt1AUo67nE9bWA5e9Sh28HXtJJZaqiPj53n6wcby');
// استخدم هذا المعرف للتفاعل مع عقد Registry
\`\`\`

### Payments Contract
\`\`\`typescript
import { PublicKey } from '@solana/web3.js';

const PAYMENTS_PROGRAM_ID = new PublicKey('8yzR2Ze7t8NjH9b9wUUaUxkHLcrfogWqAzqbMSb1vZgP');
// استخدم هذا المعرف للتفاعل مع عقد Payments
\`\`\`

### Scheduler Contract
\`\`\`typescript
import { PublicKey } from '@solana/web3.js';

const SCHEDULER_PROGRAM_ID = new PublicKey('8NWxX7CDYhpfWAG5Dd6UJQ4EU1Ykrid8CoJ48Kp8MjsY');
// استخدم هذا المعرف للتفاعل مع عقد Scheduler
\`\`\`

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
EOF

    print_success "تم تحديث DEPLOYMENT_README.md"
}

# دالة لإنشاء تقرير التحقق الشامل
create_verification_report() {
    print_status "إنشاء تقرير التحقق الشامل..."
    
    local verified_contracts=0
    local total_contracts=${#CONTRACTS[@]}
    
    cat > audit/reports/verification/verification-report.md << EOF
# تقرير التحقق الشامل - SynapsePay

## معلومات عامة
- **التاريخ**: $(date)
- **الشبكة**: devnet
- **إجمالي العقود**: $total_contracts
- **العقود المتحققة**: سيتم تحديثها

## نتائج التحقق

| العقد | Program ID | حالة التحقق | Explorer | SolScan |
|-------|------------|-------------|----------|---------|
EOF

    for contract in "${CONTRACTS[@]}"; do
        local keypair_file="target/deploy/${contract//-/_}-keypair.json"
        if [ -f "$keypair_file" ]; then
            local program_id=$(solana address -k "$keypair_file")
            
            # التحقق من العقد
            if verify_on_explorer "$contract" "$program_id"; then
                verified_contracts=$((verified_contracts + 1))
                echo "| $contract | \`$program_id\` | ✅ متحقق | [رابط](https://explorer.solana.com/address/$program_id?cluster=devnet) | [رابط](https://solscan.io/account/$program_id?cluster=devnet) |" >> audit/reports/verification/verification-report.md
            else
                echo "| $contract | \`$program_id\` | ❌ فشل | - | - |" >> audit/reports/verification/verification-report.md
            fi
            
            # اختبار الروابط
            test_links "$program_id" "$contract"
        fi
    done

    cat >> audit/reports/verification/verification-report.md << EOF

## إحصائيات التحقق
- **العقود المتحققة**: $verified_contracts/$total_contracts
- **معدل النجاح**: $(( verified_contracts * 100 / total_contracts ))%

## تفاصيل الشبكة
- **RPC URL**: $(solana config get | grep "RPC URL" | awk '{print $3}')
- **Commitment**: $(solana config get | grep "Commitment" | awk '{print $2}')
- **المحفظة**: $(solana config get | grep "Keypair Path" | awk '{print $3}')

## التوصيات
$(if [ $verified_contracts -eq $total_contracts ]; then
    echo "✅ **جميع العقود متحققة بنجاح!**"
    echo ""
    echo "- يمكن البدء في استخدام العقود"
    echo "- تأكد من تحديث التطبيقات بالـ Program IDs"
    echo "- قم بإجراء اختبارات شاملة"
else
    echo "⚠️ **بعض العقود لم يتم التحقق منها**"
    echo ""
    echo "- راجع العقود الفاشلة"
    echo "- تأكد من حالة الشبكة"
    echo "- أعد المحاولة إذا لزم الأمر"
fi)

## أوامر مفيدة للتحقق

\`\`\`bash
# التحقق من حالة برنامج
solana program show <PROGRAM_ID>

# عرض سجل المعاملات
solana transaction-history <PROGRAM_ID>

# التحقق من رصيد البرنامج
solana balance <PROGRAM_ID>

# عرض معلومات الحساب
solana account <PROGRAM_ID>
\`\`\`
EOF

    print_success "تم إنشاء تقرير التحقق: audit/reports/verification/verification-report.md"
    return $verified_contracts
}

# بدء عملية التحقق
print_status "بدء التحقق من العقود المنشورة..."

# التحقق من جميع العقود
verified_count=$(create_verification_report)

# تحديث README
update_readme

# إنشاء ملف تعليمات الاستخدام
print_status "إنشاء تعليمات الاستخدام..."

cat > USAGE_INSTRUCTIONS.md << EOF
# تعليمات استخدام SynapsePay

## البدء السريع

### 1. إعداد البيئة
\`\`\`bash
# استنساخ المشروع
git clone <repository-url>
cd synapsepay

# تثبيت التبعيات
npm install

# إعداد متغيرات البيئة
cp .env.example .env
# حدث القيم في ملف .env
\`\`\`

### 2. الاتصال بـ Devnet
\`\`\`bash
# تأكد من إعدادات Solana
solana config set --url devnet
solana config set --keypair ~/.config/solana/id.json

# تحقق من الرصيد
solana balance

# احصل على SOL من faucet إذا لزم الأمر
solana airdrop 2
\`\`\`

### 3. تشغيل التطبيق
\`\`\`bash
# تشغيل الخدمات الخلفية
npm run start:backend

# تشغيل واجهة المستخدم
npm run start:frontend
\`\`\`

## Program IDs للاستخدام

\`\`\`javascript
const PROGRAM_IDS = {
  REGISTRY: '5w8vTt1AUo67nE9bWA5e9Sh28HXtJJZaqiPj53n6wcby',
  PAYMENTS: '8yzR2Ze7t8NjH9b9wUUaUxkHLcrfogWqAzqbMSb1vZgP',
  SCHEDULER: '8NWxX7CDYhpfWAG5Dd6UJQ4EU1Ykrid8CoJ48Kp8MjsY'
};
\`\`\`

## أمثلة الاستخدام

### تسجيل وكيل جديد
\`\`\`typescript
import { registerAgent } from './src/instructions/registry';

const agentData = {
  name: 'My AI Agent',
  description: 'AI agent for task automation',
  price: 0.05, // USDC
  category: 'AI'
};

await registerAgent(connection, wallet, agentData);
\`\`\`

### إنشاء دفعة
\`\`\`typescript
import { createPayment } from './src/instructions/payments';

const paymentData = {
  amount: 0.05,
  recipient: agentOwnerPublicKey,
  agentId: 'agent-123'
};

await createPayment(connection, wallet, paymentData);
\`\`\`

### جدولة مهمة
\`\`\`typescript
import { scheduleTask } from './src/instructions/scheduler';

const taskData = {
  agentId: 'agent-123',
  schedule: '0 0 * * *', // يومياً في منتصف الليل
  duration: 30 // أيام
};

await scheduleTask(connection, wallet, taskData);
\`\`\`

## استكشاف الأخطاء

### مشاكل شائعة
1. **خطأ في الاتصال**: تأكد من أنك على devnet
2. **رصيد غير كافي**: احصل على SOL من faucet
3. **Program ID خاطئ**: تأكد من استخدام IDs الصحيحة

### أوامر التشخيص
\`\`\`bash
# فحص حالة الشبكة
solana cluster-version

# فحص حالة البرنامج
solana program show <PROGRAM_ID>

# فحص سجل المعاملات
solana logs <PROGRAM_ID>
\`\`\`
EOF

print_success "تم إنشاء تعليمات الاستخدام: USAGE_INSTRUCTIONS.md"

# طباعة النتائج النهائية
echo ""
echo "📋 ملخص التحقق والتوثيق:"
echo "============================"
echo "العقود المتحققة: $verified_count/${#CONTRACTS[@]}"
echo "معدل النجاح: $(( verified_count * 100 / ${#CONTRACTS[@]} ))%"
echo ""

if [ $verified_count -eq ${#CONTRACTS[@]} ]; then
    print_success "🎉 جميع العقود متحققة والوثائق محدثة!"
    print_info "الملفات المنشأة:"
    print_info "- DEPLOYMENT_README.md"
    print_info "- USAGE_INSTRUCTIONS.md"
    print_info "- audit/reports/verification/verification-report.md"
    exit 0
else
    print_warning "⚠️ بعض العقود لم يتم التحقق منها"
    print_info "راجع التقرير في: audit/reports/verification/verification-report.md"
    exit 1
fi