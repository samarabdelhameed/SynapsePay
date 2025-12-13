#!/bin/bash

# نظام النشر على Devnet لمشروع SynapsePay
set -e

echo "🚀 بدء نشر العقود على Devnet..."

# ألوان للمخرجات
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[DEPLOY]${NC} $1"
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
mkdir -p audit/reports/deployment

# التحقق من الشبكة الحالية
print_status "التحقق من إعدادات Solana..."
CURRENT_CLUSTER=$(solana config get | grep "RPC URL" | awk '{print $3}')
print_info "الشبكة الحالية: $CURRENT_CLUSTER"

# التأكد من أننا على devnet
if [[ "$CURRENT_CLUSTER" != *"devnet"* ]]; then
    print_warning "تغيير الشبكة إلى devnet..."
    solana config set --url devnet
    print_success "تم تغيير الشبكة إلى devnet"
fi

# التحقق من رصيد المحفظة
print_status "التحقق من رصيد المحفظة..."
WALLET_ADDRESS=$(solana address)
BALANCE=$(solana balance)
print_info "عنوان المحفظة: $WALLET_ADDRESS"
print_info "الرصيد الحالي: $BALANCE"

# التحقق من كفاية الرصيد للنشر
BALANCE_NUM=$(echo $BALANCE | awk '{print $1}')
MIN_BALANCE=1.0

if (( $(echo "$BALANCE_NUM < $MIN_BALANCE" | bc -l) )); then
    print_warning "الرصيد منخفض - طلب SOL من faucet..."
    solana airdrop 2
    sleep 5
    NEW_BALANCE=$(solana balance)
    print_info "الرصيد الجديد: $NEW_BALANCE"
fi

# قائمة العقود للنشر
CONTRACTS=("synapsepay-registry" "synapsepay-payments" "synapsepay-scheduler")
DEPLOYED_PROGRAMS=""
FAILED_DEPLOYMENTS=""
DEPLOYMENT_COSTS=0

# دالة لنشر عقد واحد
deploy_contract() {
    local contract_name="$1"
    local so_file="target/deploy/${contract_name//-/_}.so"
    local keypair_file="target/deploy/${contract_name//-/_}-keypair.json"
    
    print_status "نشر عقد ${contract_name}..."
    
    # التحقق من وجود الملفات
    if [ ! -f "$so_file" ]; then
        print_error "ملف .so غير موجود: $so_file"
        return 1
    fi
    
    if [ ! -f "$keypair_file" ]; then
        print_error "ملف keypair غير موجود: $keypair_file"
        return 1
    fi
    
    # الحصول على Program ID
    local program_id=$(solana address -k "$keypair_file")
    print_info "Program ID: $program_id"
    
    # التحقق من حالة البرنامج الحالية
    local program_exists=false
    if solana program show "$program_id" &>/dev/null; then
        program_exists=true
        print_warning "البرنامج موجود بالفعل - سيتم تحديثه"
    else
        print_info "برنامج جديد - سيتم النشر"
    fi
    
    # حساب تكلفة النشر
    local file_size=$(stat -f%z "$so_file" 2>/dev/null || stat -c%s "$so_file" 2>/dev/null)
    local estimated_cost=$(echo "scale=6; $file_size * 0.00000696" | bc -l)
    print_info "حجم الملف: $file_size bytes"
    print_info "التكلفة المقدرة: ~$estimated_cost SOL"
    
    # بدء النشر
    local deploy_log="audit/reports/deployment/${contract_name}-deploy.log"
    local start_time=$(date +%s)
    
    print_status "بدء النشر..."
    if solana program deploy "$so_file" --program-id "$keypair_file" > "$deploy_log" 2>&1; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        # التحقق من نجاح النشر
        if solana program show "$program_id" &>/dev/null; then
            print_success "✅ ${contract_name} - نشر بنجاح (${duration}s)"
            
            # الحصول على معلومات البرنامج المنشور
            local program_info=$(solana program show "$program_id" 2>/dev/null)
            local data_length=$(echo "$program_info" | grep "Data Length:" | awk '{print $3}' || echo "غير متوفر")
            local upgrade_authority=$(echo "$program_info" | grep "Upgrade Authority:" | awk '{print $3}' || echo "غير متوفر")
            
            # إنشاء تقرير النشر
            cat > "audit/reports/deployment/${contract_name}-deployment-report.md" << EOF
# تقرير نشر العقد: ${contract_name}

## معلومات النشر
- **التاريخ**: $(date)
- **المدة**: ${duration} ثانية
- **Program ID**: \`${program_id}\`
- **الشبكة**: devnet
- **حالة النشر**: ✅ نجح

## تفاصيل البرنامج
- **حجم البيانات**: ${data_length} bytes
- **سلطة التحديث**: \`${upgrade_authority}\`
- **حجم الملف**: ${file_size} bytes
- **التكلفة المقدرة**: ~${estimated_cost} SOL

## روابط التحقق
- **Solana Explorer**: [عرض البرنامج](https://explorer.solana.com/address/${program_id}?cluster=devnet)
- **SolScan**: [عرض البرنامج](https://solscan.io/account/${program_id}?cluster=devnet)

## أوامر التحقق
\`\`\`bash
# عرض معلومات البرنامج
solana program show ${program_id}

# عرض سجل المعاملات
solana transaction-history ${program_id}
\`\`\`

## الحالة
$(if [ "$program_exists" = true ]; then
    echo "🔄 **تحديث برنامج موجود**"
else
    echo "🆕 **نشر برنامج جديد**"
fi)
EOF
            
            DEPLOYED_PROGRAMS="${DEPLOYED_PROGRAMS}${contract_name} "
            DEPLOYMENT_COSTS=$(echo "$DEPLOYMENT_COSTS + $estimated_cost" | bc -l)
            return 0
        else
            print_error "❌ ${contract_name} - فشل التحقق من النشر"
            FAILED_DEPLOYMENTS="${FAILED_DEPLOYMENTS}${contract_name} "
            return 1
        fi
    else
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        print_error "❌ ${contract_name} - فشل النشر (${duration}s)"
        
        # إنشاء تقرير الفشل
        cat > "audit/reports/deployment/${contract_name}-deployment-report.md" << EOF
# تقرير نشر العقد: ${contract_name}

## معلومات النشر
- **التاريخ**: $(date)
- **المدة**: ${duration} ثانية
- **Program ID**: \`${program_id}\`
- **الشبكة**: devnet
- **حالة النشر**: ❌ فشل

## أخطاء النشر
\`\`\`
$(tail -20 "$deploy_log")
\`\`\`

## التوصيات
1. تحقق من كفاية رصيد المحفظة
2. تأكد من صحة ملف .so
3. تحقق من اتصال الشبكة
4. راجع سجل الأخطاء أعلاه
EOF
        
        FAILED_DEPLOYMENTS="${FAILED_DEPLOYMENTS}${contract_name} "
        return 1
    fi
}

# دالة لاختبار العقد المنشور
test_deployed_contract() {
    local contract_name="$1"
    local program_id="$2"
    
    print_status "اختبار العقد المنشور: ${contract_name}..."
    
    # اختبار أساسي - التحقق من وجود البرنامج
    if solana program show "$program_id" &>/dev/null; then
        print_success "✅ ${contract_name} - البرنامج متاح على الشبكة"
        
        # محاولة الحصول على IDL إذا كان متوفراً
        local idl_file="target/idl/${contract_name//-/_}.json"
        if [ -f "$idl_file" ]; then
            print_info "IDL متوفر: $idl_file"
        else
            print_warning "IDL غير متوفر"
        fi
        
        return 0
    else
        print_error "❌ ${contract_name} - البرنامج غير متاح"
        return 1
    fi
}

# بدء عملية النشر
print_status "بدء نشر العقود..."

for contract in "${CONTRACTS[@]}"; do
    deploy_contract "$contract"
    sleep 2  # انتظار قصير بين النشرات
done

# اختبار العقود المنشورة
print_status "اختبار العقود المنشورة..."

for contract in "${CONTRACTS[@]}"; do
    keypair_file="target/deploy/${contract//-/_}-keypair.json"
    if [ -f "$keypair_file" ]; then
        program_id=$(solana address -k "$keypair_file")
        test_deployed_contract "$contract" "$program_id"
    fi
done

# تحديث ملف .env بالـ Program IDs الجديدة
print_status "تحديث ملف .env..."
if [ -f ".env" ]; then
    # إنشاء نسخة احتياطية
    cp .env .env.backup.deployment.$(date +%Y%m%d_%H%M%S)
    
    # تحديث Program IDs
    for contract in "${CONTRACTS[@]}"; do
        keypair_file="target/deploy/${contract//-/_}-keypair.json"
        if [ -f "$keypair_file" ]; then
            program_id=$(solana address -k "$keypair_file")
            contract_upper=$(echo "$contract" | tr '[:lower:]' '[:upper:]')
            env_var_name="SYNAPSEPAY_${contract_upper}_PROGRAM_ID"
            env_var_name=${env_var_name//-/_}
            
            if grep -q "^${env_var_name}=" .env; then
                sed -i.bak "s/^${env_var_name}=.*/${env_var_name}=${program_id}/" .env
                print_success "تحديث ${env_var_name}: $program_id"
            else
                echo "${env_var_name}=${program_id}" >> .env
                print_success "إضافة ${env_var_name}: $program_id"
            fi
        fi
    done
fi

# إنشاء تقرير النشر الشامل
print_status "إنشاء تقرير النشر الشامل..."

DEPLOYED_COUNT=$(echo $DEPLOYED_PROGRAMS | wc -w)
FAILED_COUNT=$(echo $FAILED_DEPLOYMENTS | wc -w)
TOTAL_COUNT=${#CONTRACTS[@]}

cat > audit/reports/deployment/deployment-summary.md << EOF
# تقرير النشر الشامل - SynapsePay على Devnet

## الملخص التنفيذي
- **التاريخ**: $(date)
- **الشبكة**: devnet
- **المحفظة**: $WALLET_ADDRESS
- **إجمالي العقود**: $TOTAL_COUNT
- **المنشورة بنجاح**: $DEPLOYED_COUNT
- **الفاشلة**: $FAILED_COUNT
- **معدل النجاح**: $(( DEPLOYED_COUNT * 100 / TOTAL_COUNT ))%
- **التكلفة الإجمالية**: ~$DEPLOYMENT_COSTS SOL

## تفاصيل العقود المنشورة

| العقد | Program ID | حالة النشر | رابط Explorer |
|-------|------------|------------|----------------|
EOF

for contract in "${CONTRACTS[@]}"; do
    keypair_file="target/deploy/${contract//-/_}-keypair.json"
    if [ -f "$keypair_file" ]; then
        program_id=$(solana address -k "$keypair_file")
        if [[ "$DEPLOYED_PROGRAMS" == *"$contract"* ]]; then
            echo "| $contract | \`$program_id\` | ✅ نجح | [عرض](https://explorer.solana.com/address/$program_id?cluster=devnet) |" >> audit/reports/deployment/deployment-summary.md
        else
            echo "| $contract | \`$program_id\` | ❌ فشل | - |" >> audit/reports/deployment/deployment-summary.md
        fi
    fi
done

cat >> audit/reports/deployment/deployment-summary.md << EOF

## معلومات الشبكة
- **RPC URL**: $(solana config get | grep "RPC URL" | awk '{print $3}')
- **إصدار Solana**: $(solana --version)
- **رصيد المحفظة بعد النشر**: $(solana balance)

## التوصيات

$(if [ $FAILED_COUNT -eq 0 ]; then
    echo "✅ **جميع العقود نشرت بنجاح!**"
    echo ""
    echo "- يمكن البدء في اختبار العقود"
    echo "- تأكد من تحديث frontend بالـ Program IDs الجديدة"
    echo "- قم بإجراء اختبارات التكامل"
else
    echo "⚠️ **بعض العقود فشلت في النشر**"
    echo ""
    echo "- راجع تقارير الأخطاء المفصلة"
    echo "- أصلح المشاكل وأعد المحاولة"
    echo "- تأكد من كفاية رصيد المحفظة"
fi)

## أوامر مفيدة

\`\`\`bash
# عرض معلومات برنامج
solana program show <PROGRAM_ID>

# عرض سجل المعاملات
solana transaction-history <PROGRAM_ID>

# تحديث برنامج
solana program deploy <SO_FILE> --program-id <KEYPAIR_FILE>

# إغلاق برنامج (استرداد SOL)
solana program close <PROGRAM_ID>
\`\`\`

## روابط مفيدة
- [Solana Explorer (Devnet)](https://explorer.solana.com/?cluster=devnet)
- [SolScan (Devnet)](https://solscan.io/?cluster=devnet)
- [Solana Faucet](https://faucet.solana.com/)
EOF

# طباعة النتائج النهائية
echo ""
echo "🚀 ملخص النشر:"
echo "================"
echo "إجمالي العقود: $TOTAL_COUNT"
echo "المنشورة بنجاح: $DEPLOYED_COUNT"
echo "الفاشلة: $FAILED_COUNT"
echo "التكلفة الإجمالية: ~$DEPLOYMENT_COSTS SOL"
echo "معدل النجاح: $(( DEPLOYED_COUNT * 100 / TOTAL_COUNT ))%"
echo ""

if [ $FAILED_COUNT -eq 0 ]; then
    print_success "🎉 جميع العقود نشرت بنجاح على devnet!"
    print_info "تقرير مفصل متوفر في: audit/reports/deployment/deployment-summary.md"
    exit 0
else
    print_warning "⚠️ $FAILED_COUNT عقد فشل في النشر"
    print_info "راجع التقارير المفصلة في: audit/reports/deployment/"
    exit 1
fi