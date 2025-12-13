#!/bin/bash

# نقطة التفتيش الشاملة لمشروع SynapsePay
set -e

echo "🔍 بدء نقطة التفتيش الشاملة..."

# ألوان للمخرجات
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[CHECKPOINT]${NC} $1"
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
mkdir -p audit/reports/checkpoint

# متغيرات للإحصائيات
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

# دالة لتسجيل نتيجة الفحص
log_check_result() {
    local check_name="$1"
    local result="$2"
    local details="$3"
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    case "$result" in
        "PASS")
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
            print_success "✅ $check_name"
            ;;
        "WARN")
            WARNING_CHECKS=$((WARNING_CHECKS + 1))
            print_warning "⚠️ $check_name"
            ;;
        "FAIL")
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
            print_error "❌ $check_name"
            ;;
    esac
    
    [ -n "$details" ] && print_info "$details"
    echo "$check_name,$result,$details" >> audit/reports/checkpoint/checkpoint-results.csv
}

# إنشاء ملف CSV للنتائج
echo "Check Name,Result,Details" > audit/reports/checkpoint/checkpoint-results.csv

print_status "تشغيل فحوصات نقطة التفتيش..."

# 1. فحص بناء العقود
check_contract_builds() {
    print_status "فحص بناء العقود..."
    
    local contracts=("synapsepay-registry" "synapsepay-payments" "synapsepay-scheduler")
    local built_contracts=0
    
    for contract in "${contracts[@]}"; do
        local so_file="target/deploy/${contract//-/_}.so"
        local keypair_file="target/deploy/${contract//-/_}-keypair.json"
        
        if [ -f "$so_file" ] && [ -f "$keypair_file" ]; then
            local file_size=$(stat -f%z "$so_file" 2>/dev/null || stat -c%s "$so_file" 2>/dev/null)
            if [ "$file_size" -gt 0 ]; then
                log_check_result "Contract Build: $contract" "PASS" "Size: $file_size bytes"
                built_contracts=$((built_contracts + 1))
            else
                log_check_result "Contract Build: $contract" "FAIL" "ملف .so فارغ"
            fi
        else
            log_check_result "Contract Build: $contract" "FAIL" "ملفات البناء مفقودة"
        fi
    done
    
    if [ $built_contracts -eq ${#contracts[@]} ]; then
        log_check_result "Overall Contract Builds" "PASS" "جميع العقود مبنية ($built_contracts/${#contracts[@]})"
    else
        log_check_result "Overall Contract Builds" "FAIL" "بعض العقود لم تبنى ($built_contracts/${#contracts[@]})"
    fi
}

# 2. فحص النشر على devnet
check_devnet_deployment() {
    print_status "فحص النشر على devnet..."
    
    local contracts=("synapsepay-registry" "synapsepay-payments" "synapsepay-scheduler")
    local deployed_contracts=0
    
    for contract in "${contracts[@]}"; do
        local keypair_file="target/deploy/${contract//-/_}-keypair.json"
        
        if [ -f "$keypair_file" ]; then
            local program_id=$(solana address -k "$keypair_file")
            
            if solana program show "$program_id" &>/dev/null; then
                log_check_result "Devnet Deployment: $contract" "PASS" "Program ID: $program_id"
                deployed_contracts=$((deployed_contracts + 1))
            else
                log_check_result "Devnet Deployment: $contract" "FAIL" "البرنامج غير موجود على devnet"
            fi
        else
            log_check_result "Devnet Deployment: $contract" "FAIL" "ملف keypair مفقود"
        fi
    done
    
    if [ $deployed_contracts -eq ${#contracts[@]} ]; then
        log_check_result "Overall Devnet Deployment" "PASS" "جميع العقود منشورة ($deployed_contracts/${#contracts[@]})"
    else
        log_check_result "Overall Devnet Deployment" "FAIL" "بعض العقود غير منشورة ($deployed_contracts/${#contracts[@]})"
    fi
}

# 3. فحص إعدادات البيئة
check_environment_setup() {
    print_status "فحص إعدادات البيئة..."
    
    # فحص ملف .env
    if [ -f ".env" ]; then
        local required_vars=("SOLANA_RPC_URL" "ANCHOR_PROVIDER_URL" "ANCHOR_WALLET")
        local missing_vars=0
        
        for var in "${required_vars[@]}"; do
            if grep -q "^${var}=" .env; then
                local value=$(grep "^${var}=" .env | cut -d'=' -f2)
                if [ -n "$value" ]; then
                    log_check_result "Environment Variable: $var" "PASS" "قيمة موجودة"
                else
                    log_check_result "Environment Variable: $var" "FAIL" "قيمة فارغة"
                    missing_vars=$((missing_vars + 1))
                fi
            else
                log_check_result "Environment Variable: $var" "FAIL" "متغير مفقود"
                missing_vars=$((missing_vars + 1))
            fi
        done
        
        if [ $missing_vars -eq 0 ]; then
            log_check_result "Environment Setup" "PASS" "جميع المتغيرات المطلوبة موجودة"
        else
            log_check_result "Environment Setup" "FAIL" "$missing_vars متغيرات مفقودة أو فارغة"
        fi
    else
        log_check_result "Environment File" "FAIL" "ملف .env غير موجود"
    fi
}

# 4. فحص الأدوات المطلوبة
check_required_tools() {
    print_status "فحص الأدوات المطلوبة..."
    
    local tools=("solana" "anchor" "cargo" "rustc" "node" "npm")
    local missing_tools=0
    
    for tool in "${tools[@]}"; do
        if command -v "$tool" &> /dev/null; then
            local version=$($tool --version 2>/dev/null | head -n 1 || echo "غير متوفر")
            log_check_result "Tool: $tool" "PASS" "$version"
        else
            log_check_result "Tool: $tool" "FAIL" "غير مثبت"
            missing_tools=$((missing_tools + 1))
        fi
    done
    
    if [ $missing_tools -eq 0 ]; then
        log_check_result "Required Tools" "PASS" "جميع الأدوات مثبتة"
    else
        log_check_result "Required Tools" "FAIL" "$missing_tools أدوات مفقودة"
    fi
}

# 5. فحص الاتصال بالشبكة
check_network_connectivity() {
    print_status "فحص الاتصال بالشبكة..."
    
    # فحص RPC
    local rpc_url="https://api.devnet.solana.com"
    if curl -s -X POST "$rpc_url" \
        -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}' \
        --max-time 10 | grep -q '"result":"ok"'; then
        log_check_result "Solana RPC Connection" "PASS" "RPC متاح ويعمل"
    else
        log_check_result "Solana RPC Connection" "FAIL" "RPC غير متاح"
    fi
    
    # فحص CLI
    if solana cluster-version &>/dev/null; then
        log_check_result "Solana CLI Connection" "PASS" "CLI متصل بالشبكة"
    else
        log_check_result "Solana CLI Connection" "FAIL" "CLI غير متصل"
    fi
    
    # فحص رصيد المحفظة
    local balance=$(solana balance 2>/dev/null | awk '{print $1}' || echo "0")
    if (( $(echo "$balance > 0" | bc -l 2>/dev/null || echo "0") )); then
        log_check_result "Wallet Balance" "PASS" "الرصيد: $balance SOL"
    else
        log_check_result "Wallet Balance" "WARN" "رصيد منخفض أو صفر"
    fi
}

# 6. فحص التقارير والوثائق
check_reports_and_docs() {
    print_status "فحص التقارير والوثائق..."
    
    local required_reports=(
        "audit/reports/security-summary.md"
        "audit/reports/build/build-summary.md"
        "audit/reports/deployment/deployment-summary.md"
        "audit/reports/connections/connection-report.md"
    )
    
    local missing_reports=0
    
    for report in "${required_reports[@]}"; do
        if [ -f "$report" ]; then
            log_check_result "Report: $(basename "$report")" "PASS" "تقرير موجود"
        else
            log_check_result "Report: $(basename "$report")" "FAIL" "تقرير مفقود"
            missing_reports=$((missing_reports + 1))
        fi
    done
    
    # فحص الوثائق
    if [ -f "DEPLOYMENT_README.md" ]; then
        log_check_result "Deployment Documentation" "PASS" "وثائق النشر موجودة"
    else
        log_check_result "Deployment Documentation" "FAIL" "وثائق النشر مفقودة"
    fi
    
    if [ $missing_reports -eq 0 ]; then
        log_check_result "Reports and Documentation" "PASS" "جميع التقارير والوثائق موجودة"
    else
        log_check_result "Reports and Documentation" "WARN" "$missing_reports تقارير مفقودة"
    fi
}

# تشغيل جميع الفحوصات
check_contract_builds
check_devnet_deployment
check_environment_setup
check_required_tools
check_network_connectivity
check_reports_and_docs

# إنشاء تقرير نقطة التفتيش الشامل
print_status "إنشاء تقرير نقطة التفتيش..."

cat > audit/reports/checkpoint/checkpoint-report.md << EOF
# تقرير نقطة التفتيش الشاملة - SynapsePay

## الملخص التنفيذي
- **التاريخ**: $(date)
- **إجمالي الفحوصات**: $TOTAL_CHECKS
- **الفحوصات الناجحة**: $PASSED_CHECKS
- **التحذيرات**: $WARNING_CHECKS
- **الفحوصات الفاشلة**: $FAILED_CHECKS
- **معدل النجاح**: $(( PASSED_CHECKS * 100 / TOTAL_CHECKS ))%

## حالة المشروع العامة

$(if [ $FAILED_CHECKS -eq 0 ]; then
    echo "✅ **المشروع في حالة ممتازة!**"
    echo ""
    echo "جميع الفحوصات الأساسية نجحت. المشروع جاهز للاستخدام."
elif [ $FAILED_CHECKS -le 2 ]; then
    echo "⚠️ **المشروع في حالة جيدة مع بعض التحسينات المطلوبة**"
    echo ""
    echo "معظم الفحوصات نجحت، لكن هناك بعض المشاكل البسيطة."
else
    echo "❌ **المشروع يحتاج انتباه فوري**"
    echo ""
    echo "عدة فحوصات فشلت ويجب إصلاحها قبل المتابعة."
fi)

## تفاصيل الفحوصات

### ✅ الفحوصات الناجحة ($PASSED_CHECKS)
$(grep ",PASS," audit/reports/checkpoint/checkpoint-results.csv | while IFS=',' read -r name result details; do
    echo "- **$name**: $details"
done)

$(if [ $WARNING_CHECKS -gt 0 ]; then
    echo "### ⚠️ التحذيرات ($WARNING_CHECKS)"
    grep ",WARN," audit/reports/checkpoint/checkpoint-results.csv | while IFS=',' read -r name result details; do
        echo "- **$name**: $details"
    done
fi)

$(if [ $FAILED_CHECKS -gt 0 ]; then
    echo "### ❌ الفحوصات الفاشلة ($FAILED_CHECKS)"
    grep ",FAIL," audit/reports/checkpoint/checkpoint-results.csv | while IFS=',' read -r name result details; do
        echo "- **$name**: $details"
    done
fi)

## التوصيات

### الخطوات التالية
$(if [ $FAILED_CHECKS -eq 0 ]; then
    echo "1. ✅ المشروع جاهز للاستخدام"
    echo "2. يمكن البدء في اختبار الوظائف"
    echo "3. قم بإجراء اختبارات التكامل"
    echo "4. راجع الوثائق للاستخدام"
else
    echo "1. ❗ أصلح الفحوصات الفاشلة أولاً"
    echo "2. أعد تشغيل نقطة التفتيش"
    echo "3. تأكد من جميع المتطلبات"
    echo "4. راجع التقارير المفصلة"
fi)

### أوامر مفيدة للتشخيص

\`\`\`bash
# إعادة تشغيل نقطة التفتيش
./audit/checkpoint.sh

# فحص حالة العقود
solana program show <PROGRAM_ID>

# فحص الاتصال
./audit/test-connections.sh

# إعادة بناء العقود
./audit/build-system.sh

# إعادة النشر
./audit/deploy-devnet.sh
\`\`\`

## معلومات النظام

### إعدادات Solana
\`\`\`
$(solana config get 2>/dev/null || echo "غير متوفر")
\`\`\`

### Program IDs
$(for contract in synapsepay-registry synapsepay-payments synapsepay-scheduler; do
    keypair_file="target/deploy/${contract//-/_}-keypair.json"
    if [ -f "$keypair_file" ]; then
        program_id=$(solana address -k "$keypair_file")
        echo "- **$contract**: \`$program_id\`"
    fi
done)

### روابط مفيدة
- [Solana Explorer (Devnet)](https://explorer.solana.com/?cluster=devnet)
- [SolScan (Devnet)](https://solscan.io/?cluster=devnet)
- [Solana Status](https://status.solana.com/)

---

**تم إنشاء هذا التقرير تلقائياً في**: $(date)
EOF

# طباعة النتائج النهائية
echo ""
echo "🔍 ملخص نقطة التفتيش:"
echo "======================="
echo "إجمالي الفحوصات: $TOTAL_CHECKS"
echo "الناجحة: $PASSED_CHECKS"
echo "التحذيرات: $WARNING_CHECKS"
echo "الفاشلة: $FAILED_CHECKS"
echo "معدل النجاح: $(( PASSED_CHECKS * 100 / TOTAL_CHECKS ))%"
echo ""

if [ $FAILED_CHECKS -eq 0 ]; then
    print_success "🎉 جميع الفحوصات نجحت! المشروع جاهز للاستخدام."
    print_info "تقرير مفصل متوفر في: audit/reports/checkpoint/checkpoint-report.md"
    exit 0
elif [ $FAILED_CHECKS -le 2 ]; then
    print_warning "⚠️ المشروع في حالة جيدة مع $FAILED_CHECKS مشاكل بسيطة"
    print_info "راجع التقرير المفصل في: audit/reports/checkpoint/checkpoint-report.md"
    exit 0
else
    print_error "❌ المشروع يحتاج انتباه فوري - $FAILED_CHECKS فحوصات فشلت"
    print_info "راجع التقرير المفصل في: audit/reports/checkpoint/checkpoint-report.md"
    exit 1
fi