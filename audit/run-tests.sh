#!/bin/bash

# سكريبت تشغيل جميع اختبارات المراجعة
set -e

echo "🧪 بدء تشغيل جميع اختبارات المراجعة..."

# ألوان للمخرجات
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
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

# إنشاء مجلد التقارير
mkdir -p audit/reports

# متغير لتتبع النتائج
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# دالة لتسجيل نتيجة الاختبار
log_test_result() {
    local test_name="$1"
    local result="$2"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ "$result" = "PASS" ]; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        print_success "✅ $test_name"
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        print_error "❌ $test_name"
    fi
}

# 1. تشغيل اختبارات الخصائص Rust
print_status "تشغيل اختبارات الخصائص (Rust)..."
cd audit/property-tests
if cargo test > ../reports/property-tests-rust.txt 2>&1; then
    log_test_result "Property Tests (Rust)" "PASS"
else
    log_test_result "Property Tests (Rust)" "FAIL"
fi
cd ../..

# 2. تشغيل اختبارات الخصائص TypeScript
print_status "تشغيل اختبارات الخصائص (TypeScript)..."
cd audit/property-tests-ts

# تثبيت التبعيات إذا لم تكن موجودة
if [ ! -d "node_modules" ]; then
    print_status "تثبيت تبعيات TypeScript..."
    npm install > ../reports/npm-install.txt 2>&1
fi

if npm test > ../reports/property-tests-ts.txt 2>&1; then
    log_test_result "Property Tests (TypeScript)" "PASS"
else
    log_test_result "Property Tests (TypeScript)" "FAIL"
fi
cd ../..

# 3. تشغيل اختبارات الوحدة للعقود
print_status "تشغيل اختبارات الوحدة للعقود..."
if cargo test --all > audit/reports/unit-tests-contracts.txt 2>&1; then
    log_test_result "Unit Tests (Contracts)" "PASS"
else
    log_test_result "Unit Tests (Contracts)" "FAIL"
fi

# 4. تشغيل اختبارات Anchor
print_status "تشغيل اختبارات Anchor..."
if anchor test --skip-local-validator > audit/reports/anchor-tests-full.txt 2>&1; then
    log_test_result "Anchor Tests" "PASS"
else
    log_test_result "Anchor Tests" "FAIL"
fi

# 5. اختبار بناء العقود
print_status "اختبار بناء العقود..."
if anchor build > audit/reports/build-test.txt 2>&1; then
    log_test_result "Contract Build" "PASS"
else
    log_test_result "Contract Build" "FAIL"
fi

# 6. اختبار فحص الأمان
print_status "تشغيل فحص الأمان..."
if ./audit/security-check.sh > audit/reports/security-check-full.txt 2>&1; then
    log_test_result "Security Check" "PASS"
else
    log_test_result "Security Check" "FAIL"
fi

# إنشاء تقرير شامل
print_status "إنشاء التقرير الشامل..."
cat > audit/reports/comprehensive-test-report.md << EOF
# تقرير الاختبار الشامل - SynapsePay

## معلومات عامة
- التاريخ: $(date)
- إجمالي الاختبارات: $TOTAL_TESTS
- الاختبارات الناجحة: $PASSED_TESTS
- الاختبارات الفاشلة: $FAILED_TESTS
- معدل النجاح: $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%

## نتائج الاختبارات

### اختبارات الخصائص (Property Tests)
- اختبارات Rust: $([ -f "audit/reports/property-tests-rust.txt" ] && echo "مكتملة" || echo "غير مكتملة")
- اختبارات TypeScript: $([ -f "audit/reports/property-tests-ts.txt" ] && echo "مكتملة" || echo "غير مكتملة")

### اختبارات الوحدة (Unit Tests)
- اختبارات العقود: $([ -f "audit/reports/unit-tests-contracts.txt" ] && echo "مكتملة" || echo "غير مكتملة")
- اختبارات Anchor: $([ -f "audit/reports/anchor-tests-full.txt" ] && echo "مكتملة" || echo "غير مكتملة")

### اختبارات البناء والأمان
- بناء العقود: $([ -f "audit/reports/build-test.txt" ] && echo "مكتمل" || echo "غير مكتمل")
- فحص الأمان: $([ -f "audit/reports/security-check-full.txt" ] && echo "مكتمل" || echo "غير مكتمل")

## الحالة العامة
$([ $FAILED_TESTS -eq 0 ] && echo "✅ جميع الاختبارات نجحت - النظام جاهز للنشر" || echo "❌ بعض الاختبارات فشلت - يجب المراجعة والإصلاح")

## التوصيات
$([ $FAILED_TESTS -eq 0 ] && echo "- يمكن المتابعة لمرحلة النشر على devnet" || echo "- راجع التقارير المفصلة في مجلد audit/reports/")
$([ $FAILED_TESTS -eq 0 ] && echo "- تأكد من إعداد متغيرات البيئة" || echo "- أصلح المشاكل المكتشفة وأعد تشغيل الاختبارات")
$([ $FAILED_TESTS -eq 0 ] && echo "- قم بالنشر والتحقق من العقود" || echo "- تحقق من صحة الإعدادات والتبعيات")

EOF

# طباعة النتائج النهائية
echo ""
echo "📊 ملخص النتائج:"
echo "=================="
echo "إجمالي الاختبارات: $TOTAL_TESTS"
echo "الناجحة: $PASSED_TESTS"
echo "الفاشلة: $FAILED_TESTS"
echo "معدل النجاح: $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    print_success "🎉 جميع الاختبارات نجحت! النظام جاهز للمرحلة التالية."
    exit 0
else
    print_error "⚠️  بعض الاختبارات فشلت. راجع التقارير في audit/reports/"
    exit 1
fi