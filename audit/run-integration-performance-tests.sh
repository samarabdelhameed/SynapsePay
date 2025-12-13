#!/bin/bash

# سكريبت تشغيل اختبارات التكامل والأداء الشاملة
set -e

echo "🔗 بدء تشغيل اختبارات التكامل والأداء الشاملة..."

# ألوان للمخرجات
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

print_info() {
    echo -e "${PURPLE}[INFO]${NC} $1"
}

# إنشاء مجلد التقارير
mkdir -p audit/reports/integration-performance

# متغيرات للإحصائيات
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# دالة لتسجيل نتيجة الاختبار
log_test_result() {
    local test_name="$1"
    local result="$2"
    local details="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ "$result" = "PASS" ]; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        print_success "✅ $test_name"
        [ -n "$details" ] && print_info "$details"
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        print_error "❌ $test_name"
        [ -n "$details" ] && print_error "$details"
    fi
    
    echo "$test_name,$result,$details" >> audit/reports/integration-performance/test-results.csv
}

# إنشاء ملف CSV للنتائج
echo "Test Name,Result,Details" > audit/reports/integration-performance/test-results.csv

print_status "تشغيل اختبارات الخصائص للتكامل والأداء..."

# 1. تشغيل اختبارات الخصائص Rust للتكامل والأداء
print_status "تشغيل اختبارات الخصائص (Rust) للتكامل والأداء..."
if (cd audit/property-tests && cargo test integration_performance) > audit/reports/integration-performance/rust-integration-tests.txt 2>&1; then
    log_test_result "Rust Integration Property Tests" "PASS" "اختبارات الخصائص للتكامل نجحت"
else
    log_test_result "Rust Integration Property Tests" "FAIL" "فشل في اختبارات الخصائص للتكامل"
fi

# 2. تشغيل اختبارات الخصائص TypeScript للتكامل والأداء
print_status "تشغيل اختبارات الخصائص (TypeScript) للتكامل والأداء..."

# تثبيت التبعيات إذا لم تكن موجودة
if [ ! -d "audit/property-tests-ts/node_modules" ]; then
    print_status "تثبيت تبعيات TypeScript..."
    (cd audit/property-tests-ts && npm install) > audit/reports/integration-performance/npm-install.txt 2>&1
fi

if (cd audit/property-tests-ts && npm test -- --testPathPattern=integration-performance) > audit/reports/integration-performance/ts-integration-tests.txt 2>&1; then
    log_test_result "TypeScript Integration Property Tests" "PASS" "اختبارات الخصائص للتكامل نجحت"
else
    log_test_result "TypeScript Integration Property Tests" "FAIL" "فشل في اختبارات الخصائص للتكامل"
fi

# 3. تشغيل اختبارات التكامل الفعلية
print_status "تشغيل اختبارات التكامل الفعلية..."
if ./audit/integration-tests.sh > audit/reports/integration-performance/integration-tests-full.txt 2>&1; then
    log_test_result "Full Integration Tests" "PASS" "اختبارات التكامل الفعلية نجحت"
else
    log_test_result "Full Integration Tests" "FAIL" "فشل في اختبارات التكامل الفعلية"
fi

# 4. اختبار أداء العقود مع قياس الوقت
print_status "اختبار أداء العقود مع قياس الوقت..."
start_time=$(date +%s)

if timeout 180s anchor test --skip-local-validator > audit/reports/integration-performance/contract-performance.txt 2>&1; then
    end_time=$(date +%s)
    duration=$((end_time - start_time))
    
    if [ $duration -lt 120 ]; then
        log_test_result "Contract Performance Test" "PASS" "اكتملت في ${duration}s (أقل من 120s)"
    else
        log_test_result "Contract Performance Test" "FAIL" "استغرقت ${duration}s (أكثر من 120s)"
    fi
else
    end_time=$(date +%s)
    duration=$((end_time - start_time))
    log_test_result "Contract Performance Test" "FAIL" "فشلت أو تجاوزت الوقت المحدد (${duration}s)"
fi

# 5. اختبار الأداء تحت الضغط
print_status "اختبار الأداء تحت الضغط..."
stress_test_performance() {
    local test_count=5
    local successful_tests=0
    local total_time=0
    
    for i in $(seq 1 $test_count); do
        start_time=$(date +%s.%N)
        
        if timeout 30s anchor test --skip-local-validator -- --grep "Should.*successfully" > "audit/reports/integration-performance/stress-test-$i.txt" 2>&1; then
            end_time=$(date +%s.%N)
            test_duration=$(echo "$end_time - $start_time" | bc -l)
            total_time=$(echo "$total_time + $test_duration" | bc -l)
            successful_tests=$((successful_tests + 1))
        fi
    done
    
    if [ $successful_tests -eq $test_count ]; then
        avg_time=$(echo "scale=2; $total_time / $test_count" | bc -l)
        log_test_result "Stress Test Performance" "PASS" "$test_count اختبارات نجحت، متوسط الوقت: ${avg_time}s"
    else
        log_test_result "Stress Test Performance" "FAIL" "نجح $successful_tests من $test_count اختبارات"
    fi
}

stress_test_performance

# 6. اختبار أداء الشبكة والاتصال
print_status "اختبار أداء الشبكة والاتصال..."
network_performance_test() {
    local rpc_url="https://api.devnet.solana.com"
    local test_count=10
    local successful_requests=0
    local total_response_time=0
    
    for i in $(seq 1 $test_count); do
        start_time=$(date +%s.%N)
        
        if curl -s -X POST "$rpc_url" \
            -H "Content-Type: application/json" \
            -d '{"jsonrpc":"2.0","id":'$i',"method":"getHealth"}' \
            --max-time 5 > /dev/null; then
            
            end_time=$(date +%s.%N)
            response_time=$(echo "$end_time - $start_time" | bc -l)
            total_response_time=$(echo "$total_response_time + $response_time" | bc -l)
            successful_requests=$((successful_requests + 1))
        fi
    done
    
    if [ $successful_requests -eq $test_count ]; then
        avg_response_time=$(echo "scale=3; $total_response_time / $test_count" | bc -l)
        
        if (( $(echo "$avg_response_time < 2.0" | bc -l) )); then
            log_test_result "Network Performance Test" "PASS" "متوسط زمن الاستجابة: ${avg_response_time}s"
        else
            log_test_result "Network Performance Test" "FAIL" "زمن استجابة بطيء: ${avg_response_time}s"
        fi
    else
        log_test_result "Network Performance Test" "FAIL" "فشل في $((test_count - successful_requests)) طلبات"
    fi
}

network_performance_test

# 7. اختبار استهلاك الذاكرة
print_status "اختبار استهلاك الذاكرة..."
memory_usage_test() {
    local initial_memory=$(ps -o pid,vsz,rss,comm -p $$ | tail -n 1 | awk '{print $3}')
    
    # تشغيل عملية تستهلك ذاكرة
    anchor build > audit/reports/integration-performance/memory-test-build.txt 2>&1
    
    local final_memory=$(ps -o pid,vsz,rss,comm -p $$ | tail -n 1 | awk '{print $3}')
    local memory_increase=$((final_memory - initial_memory))
    
    # التحقق من أن زيادة الذاكرة معقولة (أقل من 100MB)
    if [ $memory_increase -lt 102400 ]; then
        log_test_result "Memory Usage Test" "PASS" "زيادة الذاكرة: ${memory_increase}KB"
    else
        log_test_result "Memory Usage Test" "FAIL" "زيادة مفرطة في الذاكرة: ${memory_increase}KB"
    fi
}

memory_usage_test

# إنشاء تقرير شامل
print_status "إنشاء التقرير الشامل للتكامل والأداء..."

cat > audit/reports/integration-performance/comprehensive-report.md << EOF
# تقرير شامل لاختبارات التكامل والأداء - SynapsePay

## الملخص التنفيذي
- **التاريخ**: $(date)
- **إجمالي الاختبارات**: $TOTAL_TESTS
- **الاختبارات الناجحة**: $PASSED_TESTS
- **الاختبارات الفاشلة**: $FAILED_TESTS
- **معدل النجاح**: $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%

## نتائج اختبارات الخصائص

### اختبارات Rust
$(grep "Rust" audit/reports/integration-performance/test-results.csv | while IFS=',' read -r name result details; do
    if [ "$result" = "PASS" ]; then
        echo "- ✅ **$name**: $details"
    else
        echo "- ❌ **$name**: $details"
    fi
done)

### اختبارات TypeScript
$(grep "TypeScript" audit/reports/integration-performance/test-results.csv | while IFS=',' read -r name result details; do
    if [ "$result" = "PASS" ]; then
        echo "- ✅ **$name**: $details"
    else
        echo "- ❌ **$name**: $details"
    fi
done)

## نتائج اختبارات التكامل

### اختبارات التكامل الكاملة
$(grep "Integration" audit/reports/integration-performance/test-results.csv | while IFS=',' read -r name result details; do
    if [ "$result" = "PASS" ]; then
        echo "- ✅ **$name**: $details"
    else
        echo "- ❌ **$name**: $details"
    fi
done)

## نتائج اختبارات الأداء

### أداء العقود
$(grep "Performance" audit/reports/integration-performance/test-results.csv | while IFS=',' read -r name result details; do
    if [ "$result" = "PASS" ]; then
        echo "- ✅ **$name**: $details"
    else
        echo "- ❌ **$name**: $details"
    fi
done)

### اختبارات الضغط والذاكرة
$(grep -E "(Stress|Memory)" audit/reports/integration-performance/test-results.csv | while IFS=',' read -r name result details; do
    if [ "$result" = "PASS" ]; then
        echo "- ✅ **$name**: $details"
    else
        echo "- ❌ **$name**: $details"
    fi
done)

## معايير الأداء المحققة

### الأهداف
- **زمن بناء العقود**: < 120 ثانية
- **زمن استجابة الشبكة**: < 2 ثانية
- **استهلاك الذاكرة**: < 100MB زيادة
- **معدل نجاح الاختبارات**: > 95%

### التوصيات

$(if [ $FAILED_TESTS -eq 0 ]; then
    echo "✅ **جميع اختبارات التكامل والأداء نجحت بامتياز!**"
    echo ""
    echo "- النظام يحقق جميع معايير الأداء المطلوبة"
    echo "- التكامل بين جميع المكونات سليم ومستقر"
    echo "- الأداء تحت الضغط مقبول ومستقر"
    echo "- استهلاك الموارد ضمن الحدود المقبولة"
    echo "- النظام جاهز للنشر على الإنتاج بثقة كاملة"
else
    echo "⚠️ **يوجد مشاكل تحتاج إلى معالجة**"
    echo ""
    echo "- راجع الاختبارات الفاشلة في التقرير أعلاه"
    echo "- حسّن الأداء في المناطق المحددة"
    echo "- أصلح مشاكل التكامل المكتشفة"
    echo "- أعد تشغيل الاختبارات بعد الإصلاحات"
    echo "- تأكد من توفر الموارد الكافية"
fi)

## ملفات السجل التفصيلية

### اختبارات الخصائص
- Rust Integration Tests: \`audit/reports/integration-performance/rust-integration-tests.txt\`
- TypeScript Integration Tests: \`audit/reports/integration-performance/ts-integration-tests.txt\`

### اختبارات التكامل
- Full Integration Tests: \`audit/reports/integration-performance/integration-tests-full.txt\`
- Contract Performance: \`audit/reports/integration-performance/contract-performance.txt\`

### اختبارات الأداء
- Stress Tests: \`audit/reports/integration-performance/stress-test-*.txt\`
- Memory Test: \`audit/reports/integration-performance/memory-test-build.txt\`

## أوامر مفيدة للمراجعة

\`\`\`bash
# مراجعة جميع السجلات
find audit/reports/integration-performance/ -name "*.txt" -exec tail -n 20 {} +

# إعادة تشغيل اختبارات محددة
./audit/run-integration-performance-tests.sh

# مراقبة الأداء في الوقت الفعلي
watch -n 5 'ps aux | grep anchor'

# فحص استهلاك الذاكرة
free -h && df -h
\`\`\`

## الخطوات التالية

$(if [ $FAILED_TESTS -eq 0 ]; then
    echo "1. ✅ المتابعة لمرحلة النشر على devnet"
    echo "2. ✅ إجراء اختبارات النظام الشاملة"
    echo "3. ✅ تحضير الوثائق النهائية"
    echo "4. ✅ التحضير للنشر على mainnet"
else
    echo "1. 🔧 إصلاح المشاكل المكتشفة"
    echo "2. 🔄 إعادة تشغيل الاختبارات"
    echo "3. 📊 مراجعة معايير الأداء"
    echo "4. 🔍 تحليل السجلات التفصيلية"
fi)
EOF

# طباعة النتائج النهائية
echo ""
echo "🔗 ملخص اختبارات التكامل والأداء:"
echo "====================================="
echo "إجمالي الاختبارات: $TOTAL_TESTS"
echo "الناجحة: $PASSED_TESTS"
echo "الفاشلة: $FAILED_TESTS"
echo "معدل النجاح: $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    print_success "🎉 جميع اختبارات التكامل والأداء نجحت بامتياز!"
    print_info "تقرير شامل متوفر في: audit/reports/integration-performance/comprehensive-report.md"
    exit 0
else
    print_warning "⚠️ $FAILED_TESTS اختبار فشل - يحتاج مراجعة"
    print_info "راجع التقرير الشامل في: audit/reports/integration-performance/comprehensive-report.md"
    exit 1
fi