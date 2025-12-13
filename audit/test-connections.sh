#!/bin/bash

# نظام اختبار الاتصال والخدمات لمشروع SynapsePay
set -e

echo "🌐 بدء اختبار الاتصال والخدمات..."

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
mkdir -p audit/reports/connections

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
    
    echo "$test_name,$result,$details" >> audit/reports/connections/test-results.csv
}

# إنشاء ملف CSV للنتائج
echo "Test Name,Result,Details" > audit/reports/connections/test-results.csv

print_status "اختبار الاتصال بشبكة Solana..."

# 1. اختبار الاتصال بـ Solana RPC
test_solana_rpc() {
    local rpc_url="https://api.devnet.solana.com"
    
    print_status "اختبار RPC: $rpc_url"
    
    # اختبار getHealth
    local health_response=$(curl -s -X POST "$rpc_url" \
        -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}' \
        --max-time 10)
    
    if echo "$health_response" | grep -q '"result":"ok"'; then
        log_test_result "Solana RPC Health" "PASS" "RPC يعمل بشكل طبيعي"
    else
        log_test_result "Solana RPC Health" "FAIL" "RPC لا يستجيب أو يعيد خطأ"
        return 1
    fi
    
    # اختبار getVersion
    local version_response=$(curl -s -X POST "$rpc_url" \
        -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","id":1,"method":"getVersion"}' \
        --max-time 10)
    
    if echo "$version_response" | grep -q '"solana-core"'; then
        local version=$(echo "$version_response" | jq -r '.result."solana-core"' 2>/dev/null || echo "غير متوفر")
        log_test_result "Solana RPC Version" "PASS" "إصدار: $version"
    else
        log_test_result "Solana RPC Version" "FAIL" "فشل في الحصول على الإصدار"
    fi
    
    # اختبار getSlot
    local slot_response=$(curl -s -X POST "$rpc_url" \
        -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","id":1,"method":"getSlot"}' \
        --max-time 10)
    
    if echo "$slot_response" | grep -q '"result"'; then
        local slot=$(echo "$slot_response" | jq -r '.result' 2>/dev/null || echo "غير متوفر")
        log_test_result "Solana Current Slot" "PASS" "Slot: $slot"
    else
        log_test_result "Solana Current Slot" "FAIL" "فشل في الحصول على Slot"
    fi
}

# 2. اختبار Solana CLI
test_solana_cli() {
    print_status "اختبار Solana CLI..."
    
    # اختبار solana config
    if solana config get &>/dev/null; then
        local rpc_url=$(solana config get | grep "RPC URL" | awk '{print $3}')
        log_test_result "Solana CLI Config" "PASS" "RPC: $rpc_url"
    else
        log_test_result "Solana CLI Config" "FAIL" "فشل في قراءة إعدادات Solana"
        return 1
    fi
    
    # اختبار solana balance
    if solana balance &>/dev/null; then
        local balance=$(solana balance)
        log_test_result "Solana CLI Balance" "PASS" "الرصيد: $balance"
    else
        log_test_result "Solana CLI Balance" "FAIL" "فشل في قراءة الرصيد"
    fi
    
    # اختبار cluster version
    if solana cluster-version &>/dev/null; then
        local cluster_version=$(solana cluster-version)
        log_test_result "Solana Cluster Version" "PASS" "الإصدار: $cluster_version"
    else
        log_test_result "Solana Cluster Version" "FAIL" "فشل في الحصول على إصدار الشبكة"
    fi
}

# 3. اختبار العقود المنشورة
test_deployed_contracts() {
    print_status "اختبار العقود المنشورة..."
    
    local contracts=("synapsepay-registry" "synapsepay-payments" "synapsepay-scheduler")
    
    for contract in "${contracts[@]}"; do
        local keypair_file="target/deploy/${contract//-/_}-keypair.json"
        
        if [ -f "$keypair_file" ]; then
            local program_id=$(solana address -k "$keypair_file")
            
            # اختبار وجود البرنامج
            if solana program show "$program_id" &>/dev/null; then
                local program_info=$(solana program show "$program_id" 2>/dev/null)
                local data_length=$(echo "$program_info" | grep "Data Length:" | awk '{print $3}' || echo "غير متوفر")
                log_test_result "Contract: $contract" "PASS" "Program ID: $program_id, Size: $data_length bytes"
            else
                log_test_result "Contract: $contract" "FAIL" "البرنامج غير موجود على الشبكة"
            fi
        else
            log_test_result "Contract: $contract" "FAIL" "ملف keypair غير موجود"
        fi
    done
}

# 4. اختبار الخدمات الخارجية
test_external_services() {
    print_status "اختبار الخدمات الخارجية..."
    
    # اختبار Solana Explorer
    local explorer_url="https://explorer.solana.com"
    if curl -s --head "$explorer_url" | head -n 1 | grep -q "200 OK"; then
        log_test_result "Solana Explorer" "PASS" "متاح على: $explorer_url"
    else
        log_test_result "Solana Explorer" "FAIL" "غير متاح"
    fi
    
    # اختبار SolScan
    local solscan_url="https://solscan.io"
    if curl -s --head "$solscan_url" | head -n 1 | grep -q "200 OK"; then
        log_test_result "SolScan" "PASS" "متاح على: $solscan_url"
    else
        log_test_result "SolScan" "FAIL" "غير متاح"
    fi
    
    # اختبار Solana Faucet
    local faucet_url="https://faucet.solana.com"
    if curl -s --head "$faucet_url" | head -n 1 | grep -q "200"; then
        log_test_result "Solana Faucet" "PASS" "متاح على: $faucet_url"
    else
        log_test_result "Solana Faucet" "FAIL" "غير متاح"
    fi
    
    # اختبار IPFS Gateway
    local ipfs_gateway="https://gateway.pinata.cloud"
    if curl -s --head "$ipfs_gateway" | head -n 1 | grep -q "200"; then
        log_test_result "IPFS Gateway" "PASS" "متاح على: $ipfs_gateway"
    else
        log_test_result "IPFS Gateway" "FAIL" "غير متاح"
    fi
}

# 5. اختبار Docker (إذا كان متوفراً)
test_docker_services() {
    print_status "اختبار خدمات Docker..."
    
    if command -v docker &> /dev/null; then
        # اختبار Docker daemon
        if docker info &>/dev/null; then
            log_test_result "Docker Daemon" "PASS" "Docker يعمل بشكل طبيعي"
            
            # اختبار الحاويات الموجودة
            local running_containers=$(docker ps --format "table {{.Names}}" | grep -v NAMES | wc -l)
            log_test_result "Docker Containers" "PASS" "عدد الحاويات العاملة: $running_containers"
        else
            log_test_result "Docker Daemon" "FAIL" "Docker غير متاح أو لا يعمل"
        fi
    else
        log_test_result "Docker Installation" "FAIL" "Docker غير مثبت"
    fi
}

# 6. اختبار أدوات التطوير
test_development_tools() {
    print_status "اختبار أدوات التطوير..."
    
    # اختبار Node.js
    if command -v node &> /dev/null; then
        local node_version=$(node --version)
        log_test_result "Node.js" "PASS" "الإصدار: $node_version"
    else
        log_test_result "Node.js" "FAIL" "غير مثبت"
    fi
    
    # اختبار npm
    if command -v npm &> /dev/null; then
        local npm_version=$(npm --version)
        log_test_result "npm" "PASS" "الإصدار: $npm_version"
    else
        log_test_result "npm" "FAIL" "غير مثبت"
    fi
    
    # اختبار Rust
    if command -v rustc &> /dev/null; then
        local rust_version=$(rustc --version)
        log_test_result "Rust" "PASS" "الإصدار: $rust_version"
    else
        log_test_result "Rust" "FAIL" "غير مثبت"
    fi
    
    # اختبار Anchor
    if command -v anchor &> /dev/null; then
        local anchor_version=$(anchor --version)
        log_test_result "Anchor" "PASS" "الإصدار: $anchor_version"
    else
        log_test_result "Anchor" "FAIL" "غير مثبت"
    fi
}

# تشغيل جميع الاختبارات
print_status "بدء تشغيل جميع اختبارات الاتصال..."

test_solana_rpc
test_solana_cli
test_deployed_contracts
test_external_services
test_docker_services
test_development_tools

# إنشاء تقرير شامل
print_status "إنشاء تقرير الاتصال الشامل..."

cat > audit/reports/connections/connection-report.md << EOF
# تقرير اختبار الاتصال والخدمات - SynapsePay

## الملخص التنفيذي
- **التاريخ**: $(date)
- **إجمالي الاختبارات**: $TOTAL_TESTS
- **الاختبارات الناجحة**: $PASSED_TESTS
- **الاختبارات الفاشلة**: $FAILED_TESTS
- **معدل النجاح**: $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%

## نتائج الاختبارات

### اختبارات الشبكة
$(grep "Solana" audit/reports/connections/test-results.csv | while IFS=',' read -r name result details; do
    if [ "$result" = "PASS" ]; then
        echo "- ✅ **$name**: $details"
    else
        echo "- ❌ **$name**: $details"
    fi
done)

### اختبارات العقود
$(grep "Contract" audit/reports/connections/test-results.csv | while IFS=',' read -r name result details; do
    if [ "$result" = "PASS" ]; then
        echo "- ✅ **$name**: $details"
    else
        echo "- ❌ **$name**: $details"
    fi
done)

### اختبارات الخدمات الخارجية
$(grep -E "(Explorer|SolScan|Faucet|IPFS)" audit/reports/connections/test-results.csv | while IFS=',' read -r name result details; do
    if [ "$result" = "PASS" ]; then
        echo "- ✅ **$name**: $details"
    else
        echo "- ❌ **$name**: $details"
    fi
done)

### اختبارات أدوات التطوير
$(grep -E "(Node|npm|Rust|Anchor|Docker)" audit/reports/connections/test-results.csv | while IFS=',' read -r name result details; do
    if [ "$result" = "PASS" ]; then
        echo "- ✅ **$name**: $details"
    else
        echo "- ❌ **$name**: $details"
    fi
done)

## التوصيات

$(if [ $FAILED_TESTS -eq 0 ]; then
    echo "✅ **جميع الاختبارات نجحت!**"
    echo ""
    echo "- البيئة جاهزة للتطوير والإنتاج"
    echo "- جميع الخدمات تعمل بشكل طبيعي"
    echo "- يمكن المتابعة بثقة"
else
    echo "⚠️ **يوجد اختبارات فاشلة تحتاج انتباه**"
    echo ""
    echo "- راجع الاختبارات الفاشلة أعلاه"
    echo "- أصلح المشاكل المكتشفة"
    echo "- أعد تشغيل الاختبارات"
fi)

## معلومات إضافية

### إعدادات Solana الحالية
\`\`\`
$(solana config get 2>/dev/null || echo "غير متوفر")
\`\`\`

### حالة الشبكة
- **RPC URL**: $(solana config get | grep "RPC URL" | awk '{print $3}' 2>/dev/null || echo "غير متوفر")
- **المحفظة**: $(solana address 2>/dev/null || echo "غير متوفر")
- **الرصيد**: $(solana balance 2>/dev/null || echo "غير متوفر")

## أوامر مفيدة للتشخيص

\`\`\`bash
# فحص حالة الشبكة
solana cluster-version

# فحص الاتصال
curl -X POST https://api.devnet.solana.com -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'

# فحص العقود
solana program show <PROGRAM_ID>

# اختبار Docker
docker ps
docker-compose ps
\`\`\`
EOF

# طباعة النتائج النهائية
echo ""
echo "🌐 ملخص اختبار الاتصال:"
echo "=========================="
echo "إجمالي الاختبارات: $TOTAL_TESTS"
echo "الناجحة: $PASSED_TESTS"
echo "الفاشلة: $FAILED_TESTS"
echo "معدل النجاح: $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    print_success "🎉 جميع اختبارات الاتصال نجحت!"
    print_info "تقرير مفصل متوفر في: audit/reports/connections/connection-report.md"
    exit 0
else
    print_warning "⚠️ $FAILED_TESTS اختبار فشل"
    print_info "راجع التقرير المفصل في: audit/reports/connections/connection-report.md"
    exit 1
fi