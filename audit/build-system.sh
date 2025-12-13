#!/bin/bash

# نظام البناء والتحقق المتقدم لمشروع SynapsePay
set -e

echo "🔨 بدء نظام البناء والتحقق المتقدم..."

# ألوان للمخرجات
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[BUILD]${NC} $1"
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
mkdir -p audit/reports/build

# متغيرات للإحصائيات
TOTAL_CONTRACTS=0
BUILT_CONTRACTS=0
FAILED_CONTRACTS=0
TOTAL_SIZE=0

# قائمة العقود
CONTRACTS=("synapsepay-registry" "synapsepay-payments" "synapsepay-scheduler")

print_status "بدء بناء العقود الذكية..."

# دالة لبناء عقد واحد
build_contract() {
    local contract_name="$1"
    local contract_path="programs/${contract_name}"
    
    print_status "بناء عقد ${contract_name}..."
    
    # التحقق من وجود المجلد
    if [ ! -d "$contract_path" ]; then
        print_error "مجلد العقد غير موجود: $contract_path"
        return 1
    fi
    
    # بناء العقد
    local build_log="audit/reports/build/${contract_name}-build.log"
    local start_time=$(date +%s)
    
    if cargo build-sbf --manifest-path "${contract_path}/Cargo.toml" > "$build_log" 2>&1; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        # التحقق من ملف .so
        local so_file="target/deploy/${contract_name//-/_}.so"
        if [ -f "$so_file" ]; then
            local file_size=$(stat -f%z "$so_file" 2>/dev/null || stat -c%s "$so_file" 2>/dev/null)
            TOTAL_SIZE=$((TOTAL_SIZE + file_size))
            
            print_success "✅ ${contract_name} - مبني بنجاح (${duration}s, ${file_size} bytes)"
            
            # إنشاء تقرير مفصل للعقد
            cat > "audit/reports/build/${contract_name}-report.md" << EOF
# تقرير بناء العقد: ${contract_name}

## معلومات البناء
- **الوقت**: $(date)
- **المدة**: ${duration} ثانية
- **حجم الملف**: ${file_size} bytes
- **المسار**: ${so_file}

## حالة البناء
✅ **نجح البناء**

## التحذيرات
$(grep -c "warning:" "$build_log" || echo "0") تحذير

## الملفات المنتجة
- \`${so_file}\`
- \`target/deploy/${contract_name//-/_}-keypair.json\`

## التوقيع
\`\`\`
$(solana address -k "target/deploy/${contract_name//-/_}-keypair.json" 2>/dev/null || echo "غير متوفر")
\`\`\`
EOF
            
            BUILT_CONTRACTS=$((BUILT_CONTRACTS + 1))
            return 0
        else
            print_error "❌ ${contract_name} - ملف .so غير موجود"
            FAILED_CONTRACTS=$((FAILED_CONTRACTS + 1))
            return 1
        fi
    else
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        print_error "❌ ${contract_name} - فشل البناء (${duration}s)"
        
        # إنشاء تقرير الفشل
        cat > "audit/reports/build/${contract_name}-report.md" << EOF
# تقرير بناء العقد: ${contract_name}

## معلومات البناء
- **الوقت**: $(date)
- **المدة**: ${duration} ثانية
- **الحالة**: ❌ فشل

## أخطاء البناء
\`\`\`
$(tail -20 "$build_log")
\`\`\`

## التوصيات
1. راجع أخطاء البناء أعلاه
2. تأكد من صحة التبعيات
3. تحقق من صحة الكود
EOF
        
        FAILED_CONTRACTS=$((FAILED_CONTRACTS + 1))
        return 1
    fi
}

# دالة للتحقق من صحة ملف .so
verify_so_file() {
    local so_file="$1"
    local contract_name="$2"
    
    print_status "التحقق من صحة ${contract_name}..."
    
    # التحقق من وجود الملف
    if [ ! -f "$so_file" ]; then
        print_error "ملف .so غير موجود: $so_file"
        return 1
    fi
    
    # التحقق من حجم الملف
    local file_size=$(stat -f%z "$so_file" 2>/dev/null || stat -c%s "$so_file" 2>/dev/null)
    if [ "$file_size" -eq 0 ]; then
        print_error "ملف .so فارغ: $so_file"
        return 1
    fi
    
    # التحقق من نوع الملف
    local file_type=$(file "$so_file" 2>/dev/null || echo "unknown")
    if [[ "$file_type" != *"ELF"* ]]; then
        print_warning "نوع الملف غير متوقع: $file_type"
    fi
    
    # التحقق من البرنامج ID
    local keypair_file="target/deploy/${contract_name//-/_}-keypair.json"
    if [ -f "$keypair_file" ]; then
        local program_id=$(solana address -k "$keypair_file" 2>/dev/null || echo "غير متوفر")
        print_info "Program ID: $program_id"
    fi
    
    print_success "✅ ${contract_name} - التحقق مكتمل"
    return 0
}

# بناء جميع العقود
for contract in "${CONTRACTS[@]}"; do
    TOTAL_CONTRACTS=$((TOTAL_CONTRACTS + 1))
    build_contract "$contract"
done

print_status "التحقق من صحة الملفات المبنية..."

# التحقق من جميع الملفات
for contract in "${CONTRACTS[@]}"; do
    so_file="target/deploy/${contract//-/_}.so"
    if [ -f "$so_file" ]; then
        verify_so_file "$so_file" "$contract"
    fi
done

# إنشاء تقرير شامل
print_status "إنشاء التقرير الشامل..."

cat > audit/reports/build/build-summary.md << EOF
# تقرير البناء الشامل - SynapsePay

## الملخص التنفيذي
- **التاريخ**: $(date)
- **إجمالي العقود**: $TOTAL_CONTRACTS
- **العقود المبنية بنجاح**: $BUILT_CONTRACTS
- **العقود الفاشلة**: $FAILED_CONTRACTS
- **معدل النجاح**: $(( BUILT_CONTRACTS * 100 / TOTAL_CONTRACTS ))%
- **الحجم الإجمالي**: $TOTAL_SIZE bytes

## تفاصيل العقود

| العقد | الحالة | الحجم | Program ID |
|-------|--------|-------|------------|
EOF

for contract in "${CONTRACTS[@]}"; do
    so_file="target/deploy/${contract//-/_}.so"
    keypair_file="target/deploy/${contract//-/_}-keypair.json"
    
    if [ -f "$so_file" ]; then
        file_size=$(stat -f%z "$so_file" 2>/dev/null || stat -c%s "$so_file" 2>/dev/null)
        program_id=$(solana address -k "$keypair_file" 2>/dev/null || echo "غير متوفر")
        echo "| $contract | ✅ نجح | ${file_size} bytes | \`$program_id\` |" >> audit/reports/build/build-summary.md
    else
        echo "| $contract | ❌ فشل | - | - |" >> audit/reports/build/build-summary.md
    fi
done

cat >> audit/reports/build/build-summary.md << EOF

## الملفات المنتجة

\`\`\`
target/deploy/
├── synapsepay_registry.so
├── synapsepay_registry-keypair.json
├── synapsepay_payments.so
├── synapsepay_payments-keypair.json
├── synapsepay_scheduler.so
└── synapsepay_scheduler-keypair.json
\`\`\`

## التوصيات

$(if [ $FAILED_CONTRACTS -eq 0 ]; then
    echo "✅ **جميع العقود مبنية بنجاح!**"
    echo ""
    echo "- يمكن المتابعة لمرحلة النشر"
    echo "- تأكد من اختبار العقود قبل النشر"
    echo "- احفظ نسخة احتياطية من المفاتيح"
else
    echo "⚠️ **يوجد عقود فاشلة تحتاج إصلاح**"
    echo ""
    echo "- راجع تقارير الأخطاء المفصلة"
    echo "- أصلح المشاكل المكتشفة"
    echo "- أعد تشغيل البناء"
fi)

## أوامر مفيدة

\`\`\`bash
# عرض معلومات العقد
solana program show <PROGRAM_ID>

# نشر العقد
solana program deploy target/deploy/<CONTRACT>.so

# التحقق من العقد
solana program show <PROGRAM_ID> --programs
\`\`\`
EOF

# طباعة النتائج النهائية
echo ""
echo "🔨 ملخص البناء:"
echo "=================="
echo "إجمالي العقود: $TOTAL_CONTRACTS"
echo "المبنية بنجاح: $BUILT_CONTRACTS"
echo "الفاشلة: $FAILED_CONTRACTS"
echo "الحجم الإجمالي: $TOTAL_SIZE bytes"
echo "معدل النجاح: $(( BUILT_CONTRACTS * 100 / TOTAL_CONTRACTS ))%"
echo ""

if [ $FAILED_CONTRACTS -eq 0 ]; then
    print_success "🎉 جميع العقود مبنية بنجاح! النظام جاهز للنشر."
    exit 0
else
    print_error "⚠️ $FAILED_CONTRACTS عقد فشل في البناء. راجع التقارير في audit/reports/build/"
    exit 1
fi