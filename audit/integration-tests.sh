#!/bin/bash

# نظام اختبار التكامل والأداء لمشروع SynapsePay
set -e

echo "🔗 بدء اختبار التكامل والأداء..."

# ألوان للمخرجات
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[TEST]${NC} $1"
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
mkdir -p audit/reports/integration

# متغيرات للإحصائيات
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# دالة لتسجيل نتيجة الاختبار
log_test_result() {
    local test_name="$1"
    local result="$2"
    local details="$3"
    local duration="$4"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ "$result" = "PASS" ]; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        print_success "✅ $test_name ($duration)"
        [ -n "$details" ] && print_info "$details"
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        print_error "❌ $test_name ($duration)"
        [ -n "$details" ] && print_error "$details"
    fi
    
    echo "$test_name,$result,$details,$duration" >> audit/reports/integration/test-results.csv
}

# دالة لقياس الوقت
measure_time() {
    local start_time=$(date +%s.%N)
    "$@"
    local end_time=$(date +%s.%N)
    local duration=$(echo "$end_time - $start_time" | bc -l)
    printf "%.3fs" "$duration"
}

# إنشاء ملف CSV للنتائج
echo "Test Name,Result,Details,Duration" > audit/reports/integration/test-results.csv

print_status "بدء اختبارات التكامل..."

# 1. اختبار التكامل بين Registry و Payments
test_registry_payments_integration() {
    print_status "اختبار التكامل: Registry ↔ Payments"
    
    local start_time=$(date +%s.%N)
    
    # تشغيل اختبار تكامل مخصص
    if timeout 60s anchor test --skip-local-validator -- --grep "Registry.*Payment" > audit/reports/integration/registry-payments.log 2>&1; then
        local end_time=$(date +%s.%N)
        local duration=$(echo "$end_time - $start_time" | bc -l)
        log_test_result "Registry-Payments Integration" "PASS" "تكامل ناجح بين تسجيل الوكلاء والمدفوعات" "$(printf "%.3fs" "$duration")"
    else
        local end_time=$(date +%s.%N)
        local duration=$(echo "$end_time - $start_time" | bc -l)
        log_test_result "Registry-Payments Integration" "FAIL" "فشل في التكامل بين Registry و Payments" "$(printf "%.3fs" "$duration")"
    fi
}

# 2. اختبار التكامل بين Payments و Scheduler
test_payments_scheduler_integration() {
    print_status "اختبار التكامل: Payments ↔ Scheduler"
    
    local start_time=$(date +%s.%N)
    
    # تشغيل اختبار تكامل مخصص
    if timeout 60s anchor test --skip-local-validator -- --grep "Payment.*Scheduler" > audit/reports/integration/payments-scheduler.log 2>&1; then
        local end_time=$(date +%s.%N)
        local duration=$(echo "$end_time - $start_time" | bc -l)
        log_test_result "Payments-Scheduler Integration" "PASS" "تكامل ناجح بين المدفوعات والمهام المجدولة" "$(printf "%.3fs" "$duration")"
    else
        local end_time=$(date +%s.%N)
        local duration=$(echo "$end_time - $start_time" | bc -l)
        log_test_result "Payments-Scheduler Integration" "FAIL" "فشل في التكامل بين Payments و Scheduler" "$(printf "%.3fs" "$duration")"
    fi
}

# 3. اختبار التكامل الشامل للعقود الثلاثة
test_full_contracts_integration() {
    print_status "اختبار التكامل الشامل للعقود الثلاثة"
    
    local start_time=$(date +%s.%N)
    
    # تشغيل جميع الاختبارات معاً
    if timeout 120s anchor test --skip-local-validator > audit/reports/integration/full-integration.log 2>&1; then
        local end_time=$(date +%s.%N)
        local duration=$(echo "$end_time - $start_time" | bc -l)
        log_test_result "Full Contracts Integration" "PASS" "تكامل ناجح بين جميع العقود" "$(printf "%.3fs" "$duration")"
    else
        local end_time=$(date +%s.%N)
        local duration=$(echo "$end_time - $start_time" | bc -l)
        log_test_result "Full Contracts Integration" "FAIL" "فشل في التكامل الشامل" "$(printf "%.3fs" "$duration")"
    fi
}

# 4. اختبار أداء العقود
test_contract_performance() {
    print_status "اختبار أداء العقود..."
    
    # اختبار أداء Registry
    local start_time=$(date +%s.%N)
    if timeout 30s anchor test --skip-local-validator -- --grep "register.*agent" > audit/reports/integration/registry-performance.log 2>&1; then
        local end_time=$(date +%s.%N)
        local duration=$(echo "$end_time - $start_time" | bc -l)
        local duration_formatted=$(printf "%.3fs" "$duration")
        
        # التحقق من أن الوقت أقل من 10 ثوانٍ
        if (( $(echo "$duration < 10.0" | bc -l) )); then
            log_test_result "Registry Performance" "PASS" "تسجيل وكيل في وقت مقبول" "$duration_formatted"
        else
            log_test_result "Registry Performance" "FAIL" "تسجيل الوكيل يستغرق وقتاً طويلاً" "$duration_formatted"
        fi
    else
        local end_time=$(date +%s.%N)
        local duration=$(echo "$end_time - $start_time" | bc -l)
        log_test_result "Registry Performance" "FAIL" "فشل في اختبار أداء Registry" "$(printf "%.3fs" "$duration")"
    fi
    
    # اختبار أداء Payments
    local start_time=$(date +%s.%N)
    if timeout 30s anchor test --skip-local-validator -- --grep "create.*invoice" > audit/reports/integration/payments-performance.log 2>&1; then
        local end_time=$(date +%s.%N)
        local duration=$(echo "$end_time - $start_time" | bc -l)
        local duration_formatted=$(printf "%.3fs" "$duration")
        
        # التحقق من أن الوقت أقل من 15 ثانية
        if (( $(echo "$duration < 15.0" | bc -l) )); then
            log_test_result "Payments Performance" "PASS" "إنشاء فاتورة في وقت مقبول" "$duration_formatted"
        else
            log_test_result "Payments Performance" "FAIL" "إنشاء الفاتورة يستغرق وقتاً طويلاً" "$duration_formatted"
        fi
    else
        local end_time=$(date +%s.%N)
        local duration=$(echo "$end_time - $start_time" | bc -l)
        log_test_result "Payments Performance" "FAIL" "فشل في اختبار أداء Payments" "$(printf "%.3fs" "$duration")"
    fi
    
    # اختبار أداء Scheduler
    local start_time=$(date +%s.%N)
    if timeout 30s anchor test --skip-local-validator -- --grep "create.*subscription" > audit/reports/integration/scheduler-performance.log 2>&1; then
        local end_time=$(date +%s.%N)
        local duration=$(echo "$end_time - $start_time" | bc -l)
        local duration_formatted=$(printf "%.3fs" "$duration")
        
        # التحقق من أن الوقت أقل من 12 ثانية
        if (( $(echo "$duration < 12.0" | bc -l) )); then
            log_test_result "Scheduler Performance" "PASS" "إنشاء اشتراك في وقت مقبول" "$duration_formatted"
        else
            log_test_result "Scheduler Performance" "FAIL" "إنشاء الاشتراك يستغرق وقتاً طويلاً" "$duration_formatted"
        fi
    else
        local end_time=$(date +%s.%N)
        local duration=$(echo "$end_time - $start_time" | bc -l)
        log_test_result "Scheduler Performance" "FAIL" "فشل في اختبار أداء Scheduler" "$(printf "%.3fs" "$duration")"
    fi
}

# 5. اختبار أداء الشبكة
test_network_performance() {
    print_status "اختبار أداء الشبكة..."
    
    local rpc_url="https://api.devnet.solana.com"
    
    # اختبار زمن الاستجابة
    local start_time=$(date +%s.%N)
    local response=$(curl -s -w "%{time_total}" -X POST "$rpc_url" \
        -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}' \
        --max-time 5)
    local end_time=$(date +%s.%N)
    
    local response_time=$(echo "$response" | tail -n1)
    
    # التحقق من أن زمن الاستجابة أقل من 2 ثانية
    if (( $(echo "$response_time < 2.0" | bc -l) )); then
        log_test_result "Network Response Time" "PASS" "زمن استجابة مقبول" "${response_time}s"
    else
        log_test_result "Network Response Time" "FAIL" "زمن استجابة بطيء" "${response_time}s"
    fi
    
    # اختبار عدة طلبات متتالية
    local total_time=0
    local successful_requests=0
    
    for i in {1..5}; do
        local start_time=$(date +%s.%N)
        if curl -s -X POST "$rpc_url" \
            -H "Content-Type: application/json" \
            -d '{"jsonrpc":"2.0","id":'$i',"method":"getSlot"}' \
            --max-time 3 > /dev/null; then
            local end_time=$(date +%s.%N)
            local request_time=$(echo "$end_time - $start_time" | bc -l)
            total_time=$(echo "$total_time + $request_time" | bc -l)
            successful_requests=$((successful_requests + 1))
        fi
    done
    
    if [ $successful_requests -eq 5 ]; then
        local avg_time=$(echo "scale=3; $total_time / 5" | bc -l)
        log_test_result "Network Throughput" "PASS" "5 طلبات ناجحة" "${avg_time}s avg"
    else
        log_test_result "Network Throughput" "FAIL" "فشل في $((5 - successful_requests)) طلبات" "N/A"
    fi
}

# 6. اختبار تحميل العقود
test_contract_load() {
    print_status "اختبار تحميل العقود..."
    
    # محاكاة عدة معاملات متزامنة
    local start_time=$(date +%s.%N)
    
    # تشغيل اختبارات متعددة في الخلفية
    local pids=()
    
    for i in {1..3}; do
        (
            timeout 45s anchor test --skip-local-validator -- --grep "Should.*successfully" > "audit/reports/integration/load-test-$i.log" 2>&1
        ) &
        pids+=($!)
    done
    
    # انتظار انتهاء جميع العمليات
    local successful_tests=0
    for pid in "${pids[@]}"; do
        if wait "$pid"; then
            successful_tests=$((successful_tests + 1))
        fi
    done
    
    local end_time=$(date +%s.%N)
    local duration=$(echo "$end_time - $start_time" | bc -l)
    local duration_formatted=$(printf "%.3fs" "$duration")
    
    if [ $successful_tests -eq 3 ]; then
        log_test_result "Contract Load Test" "PASS" "3 اختبارات متزامنة ناجحة" "$duration_formatted"
    else
        log_test_result "Contract Load Test" "FAIL" "فشل في $((3 - successful_tests)) اختبارات" "$duration_formatted"
    fi
}

# تشغيل جميع الاختبارات
print_status "بدء تشغيل جميع اختبارات التكامل والأداء..."

test_registry_payments_integration
test_payments_scheduler_integration
test_full_contracts_integration
test_contract_performance
test_network_performance
test_contract_load

# إنشاء تقرير شامل
print_status "إنشاء تقرير التكامل والأداء الشامل..."

cat > audit/reports/integration/integration-performance-report.md << EOF
# تقرير اختبار التكامل والأداء - SynapsePay

## الملخص التنفيذي
- **التاريخ**: $(date)
- **إجمالي الاختبارات**: $TOTAL_TESTS
- **الاختبارات الناجحة**: $PASSED_TESTS
- **الاختبارات الفاشلة**: $FAILED_TESTS
- **معدل النجاح**: $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%

## نتائج اختبارات التكامل

### تكامل العقود
$(grep "Integration" audit/reports/integration/test-results.csv | while IFS=',' read -r name result details duration; do
    if [ "$result" = "PASS" ]; then
        echo "- ✅ **$name** ($duration): $details"
    else
        echo "- ❌ **$name** ($duration): $details"
    fi
done)

## نتائج اختبارات الأداء

### أداء العقود
$(grep "Performance" audit/reports/integration/test-results.csv | while IFS=',' read -r name result details duration; do
    if [ "$result" = "PASS" ]; then
        echo "- ✅ **$name** ($duration): $details"
    else
        echo "- ❌ **$name** ($duration): $details"
    fi
done)

### أداء الشبكة
$(grep "Network" audit/reports/integration/test-results.csv | while IFS=',' read -r name result details duration; do
    if [ "$result" = "PASS" ]; then
        echo "- ✅ **$name** ($duration): $details"
    else
        echo "- ❌ **$name** ($duration): $details"
    fi
done)

### اختبارات التحميل
$(grep "Load" audit/reports/integration/test-results.csv | while IFS=',' read -r name result details duration; do
    if [ "$result" = "PASS" ]; then
        echo "- ✅ **$name** ($duration): $details"
    else
        echo "- ❌ **$name** ($duration): $details"
    fi
done)

## معايير الأداء

### الأهداف المحققة
- **زمن استجابة الشبكة**: < 2 ثانية
- **تسجيل الوكيل**: < 10 ثوانٍ
- **إنشاء الفاتورة**: < 15 ثانية
- **إنشاء الاشتراك**: < 12 ثانية

### التوصيات

$(if [ $FAILED_TESTS -eq 0 ]; then
    echo "✅ **جميع اختبارات التكامل والأداء نجحت!**"
    echo ""
    echo "- النظام يعمل بكفاءة عالية"
    echo "- التكامل بين العقود سليم"
    echo "- الأداء يلبي المعايير المطلوبة"
    echo "- جاهز للنشر على الإنتاج"
else
    echo "⚠️ **يوجد مشاكل في الأداء أو التكامل**"
    echo ""
    echo "- راجع الاختبارات الفاشلة أعلاه"
    echo "- حسّن الأداء حسب الحاجة"
    echo "- أصلح مشاكل التكامل"
    echo "- أعد تشغيل الاختبارات"
fi)

## تفاصيل إضافية

### ملفات السجل
- Registry-Payments: \`audit/reports/integration/registry-payments.log\`
- Payments-Scheduler: \`audit/reports/integration/payments-scheduler.log\`
- Full Integration: \`audit/reports/integration/full-integration.log\`
- Performance Logs: \`audit/reports/integration/*-performance.log\`
- Load Tests: \`audit/reports/integration/load-test-*.log\`

### أوامر مفيدة للتحليل

\`\`\`bash
# مراجعة سجلات التكامل
tail -f audit/reports/integration/*.log

# إعادة تشغيل اختبار محدد
anchor test --skip-local-validator -- --grep "Registry.*Payment"

# مراقبة الأداء
time anchor test --skip-local-validator
\`\`\`
EOF

# طباعة النتائج النهائية
echo ""
echo "🔗 ملخص اختبار التكامل والأداء:"
echo "=================================="
echo "إجمالي الاختبارات: $TOTAL_TESTS"
echo "الناجحة: $PASSED_TESTS"
echo "الفاشلة: $FAILED_TESTS"
echo "معدل النجاح: $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    print_success "🎉 جميع اختبارات التكامل والأداء نجحت!"
    print_info "تقرير مفصل متوفر في: audit/reports/integration/integration-performance-report.md"
    exit 0
else
    print_warning "⚠️ $FAILED_TESTS اختبار فشل"
    print_info "راجع التقرير المفصل في: audit/reports/integration/integration-performance-report.md"
    exit 1
fi