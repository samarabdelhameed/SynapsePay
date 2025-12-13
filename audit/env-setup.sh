#!/bin/bash

# نظام إعداد البيئة التلقائي لمشروع SynapsePay
set -e

echo "⚙️ بدء إعداد البيئة التلقائي..."

# ألوان للمخرجات
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[ENV]${NC} $1"
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
mkdir -p audit/reports/env

# دالة للتحقق من وجود أمر
check_command() {
    local cmd="$1"
    if command -v "$cmd" &> /dev/null; then
        return 0
    else
        return 1
    fi
}

# دالة للتحقق من إصدار أمر
check_version() {
    local cmd="$1"
    local version_flag="$2"
    local expected_pattern="$3"
    
    if check_command "$cmd"; then
        local version_output=$($cmd $version_flag 2>&1 || echo "غير متوفر")
        echo "$version_output"
        return 0
    else
        echo "غير مثبت"
        return 1
    fi
}

print_status "فحص الأدوات المطلوبة..."

# فحص الأدوات الأساسية
TOOLS_STATUS=""

# Rust
print_status "فحص Rust..."
if check_command "rustc"; then
    RUST_VERSION=$(rustc --version)
    print_success "Rust مثبت: $RUST_VERSION"
    TOOLS_STATUS="${TOOLS_STATUS}✅ Rust: $RUST_VERSION\n"
else
    print_error "Rust غير مثبت"
    TOOLS_STATUS="${TOOLS_STATUS}❌ Rust: غير مثبت\n"
fi

# Cargo
print_status "فحص Cargo..."
if check_command "cargo"; then
    CARGO_VERSION=$(cargo --version)
    print_success "Cargo مثبت: $CARGO_VERSION"
    TOOLS_STATUS="${TOOLS_STATUS}✅ Cargo: $CARGO_VERSION\n"
else
    print_error "Cargo غير مثبت"
    TOOLS_STATUS="${TOOLS_STATUS}❌ Cargo: غير مثبت\n"
fi

# Solana CLI
print_status "فحص Solana CLI..."
if check_command "solana"; then
    SOLANA_VERSION=$(solana --version)
    print_success "Solana CLI مثبت: $SOLANA_VERSION"
    TOOLS_STATUS="${TOOLS_STATUS}✅ Solana CLI: $SOLANA_VERSION\n"
else
    print_error "Solana CLI غير مثبت"
    TOOLS_STATUS="${TOOLS_STATUS}❌ Solana CLI: غير مثبت\n"
fi

# Anchor
print_status "فحص Anchor..."
if check_command "anchor"; then
    ANCHOR_VERSION=$(anchor --version)
    print_success "Anchor مثبت: $ANCHOR_VERSION"
    TOOLS_STATUS="${TOOLS_STATUS}✅ Anchor: $ANCHOR_VERSION\n"
else
    print_error "Anchor غير مثبت"
    TOOLS_STATUS="${TOOLS_STATUS}❌ Anchor: غير مثبت\n"
fi

# Node.js
print_status "فحص Node.js..."
if check_command "node"; then
    NODE_VERSION=$(node --version)
    print_success "Node.js مثبت: $NODE_VERSION"
    TOOLS_STATUS="${TOOLS_STATUS}✅ Node.js: $NODE_VERSION\n"
else
    print_warning "Node.js غير مثبت"
    TOOLS_STATUS="${TOOLS_STATUS}⚠️ Node.js: غير مثبت\n"
fi

# npm
print_status "فحص npm..."
if check_command "npm"; then
    NPM_VERSION=$(npm --version)
    print_success "npm مثبت: $NPM_VERSION"
    TOOLS_STATUS="${TOOLS_STATUS}✅ npm: $NPM_VERSION\n"
else
    print_warning "npm غير مثبت"
    TOOLS_STATUS="${TOOLS_STATUS}⚠️ npm: غير مثبت\n"
fi

print_status "إنشاء ملف .env..."

# التحقق من وجود ملف .env
if [ -f ".env" ]; then
    print_warning "ملف .env موجود بالفعل - سيتم إنشاء نسخة احتياطية"
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
fi

# الحصول على معلومات Solana
SOLANA_CONFIG_FILE="$HOME/.config/solana/cli/config.yml"
SOLANA_RPC_URL="https://api.devnet.solana.com"
SOLANA_WS_URL="wss://api.devnet.solana.com"

if [ -f "$SOLANA_CONFIG_FILE" ]; then
    CURRENT_RPC=$(grep "json_rpc_url:" "$SOLANA_CONFIG_FILE" | awk '{print $2}' || echo "$SOLANA_RPC_URL")
    CURRENT_WALLET=$(grep "keypair_path:" "$SOLANA_CONFIG_FILE" | awk '{print $2}' || echo "$HOME/.config/solana/id.json")
else
    CURRENT_RPC="$SOLANA_RPC_URL"
    CURRENT_WALLET="$HOME/.config/solana/id.json"
fi

# إنشاء ملف .env جديد
cat > .env << EOF
# SynapsePay Environment Configuration
# Generated on $(date)

# Solana Configuration
SOLANA_RPC_URL=$CURRENT_RPC
SOLANA_WS_URL=$SOLANA_WS_URL
ANCHOR_PROVIDER_URL=$CURRENT_RPC
ANCHOR_WALLET=$CURRENT_WALLET

# Program IDs (Generated from keypairs)
SYNAPSEPAY_REGISTRY_PROGRAM_ID=$(solana address -k target/deploy/synapsepay_registry-keypair.json 2>/dev/null || echo "PLACEHOLDER_REGISTRY_ID")
SYNAPSEPAY_PAYMENTS_PROGRAM_ID=$(solana address -k target/deploy/synapsepay_payments-keypair.json 2>/dev/null || echo "PLACEHOLDER_PAYMENTS_ID")
SYNAPSEPAY_SCHEDULER_PROGRAM_ID=$(solana address -k target/deploy/synapsepay_scheduler-keypair.json 2>/dev/null || echo "PLACEHOLDER_SCHEDULER_ID")

# Network Configuration
SOLANA_NETWORK=devnet
SOLANA_COMMITMENT=confirmed

# API Configuration
API_PORT=8404
FACILITATOR_PORT=8403
WEB_PORT=5173

# Security
JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "CHANGE_THIS_JWT_SECRET_IN_PRODUCTION")
ENCRYPTION_KEY=$(openssl rand -hex 16 2>/dev/null || echo "CHANGE_THIS_ENCRYPTION_KEY")

# Database (if needed)
DATABASE_URL=sqlite:./synapsepay.db

# Logging
LOG_LEVEL=info
DEBUG=false

# Development
NODE_ENV=development
RUST_LOG=info

# External Services
IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/
ARWEAVE_GATEWAY=https://arweave.net/

# AI Services (Optional)
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Monitoring
METRICS_ENABLED=true
HEALTH_CHECK_INTERVAL=30000

# Rate Limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF

print_success "ملف .env تم إنشاؤه بنجاح"

# التحقق من صحة المتغيرات
print_status "التحقق من صحة متغيرات البيئة..."

MISSING_VARS=""
REQUIRED_VARS=("SOLANA_RPC_URL" "ANCHOR_PROVIDER_URL" "ANCHOR_WALLET")

for var in "${REQUIRED_VARS[@]}"; do
    if grep -q "^${var}=" .env; then
        value=$(grep "^${var}=" .env | cut -d'=' -f2)
        if [ -n "$value" ] && [ "$value" != "PLACEHOLDER_"* ]; then
            print_success "✅ $var: $value"
        else
            print_warning "⚠️ $var: يحتاج تحديث"
            MISSING_VARS="${MISSING_VARS}$var "
        fi
    else
        print_error "❌ $var: مفقود"
        MISSING_VARS="${MISSING_VARS}$var "
    fi
done

# التحقق من صحة المحفظة
print_status "التحقق من صحة المحفظة..."
if [ -f "$CURRENT_WALLET" ]; then
    WALLET_ADDRESS=$(solana address -k "$CURRENT_WALLET" 2>/dev/null || echo "غير صالح")
    if [ "$WALLET_ADDRESS" != "غير صالح" ]; then
        print_success "✅ المحفظة صالحة: $WALLET_ADDRESS"
        
        # التحقق من رصيد المحفظة
        BALANCE=$(solana balance "$WALLET_ADDRESS" --url "$CURRENT_RPC" 2>/dev/null || echo "0")
        print_info "رصيد المحفظة: $BALANCE"
        
        if [[ "$BALANCE" == "0"* ]]; then
            print_warning "⚠️ رصيد المحفظة منخفض - قد تحتاج لطلب SOL من faucet"
        fi
    else
        print_error "❌ المحفظة غير صالحة"
    fi
else
    print_error "❌ ملف المحفظة غير موجود: $CURRENT_WALLET"
fi

# اختبار الاتصال بالشبكة
print_status "اختبار الاتصال بشبكة Solana..."
if solana cluster-version --url "$CURRENT_RPC" &>/dev/null; then
    CLUSTER_VERSION=$(solana cluster-version --url "$CURRENT_RPC" 2>/dev/null || echo "غير متوفر")
    print_success "✅ الاتصال بالشبكة ناجح: $CLUSTER_VERSION"
else
    print_error "❌ فشل الاتصال بالشبكة: $CURRENT_RPC"
fi

# إنشاء تقرير البيئة
print_status "إنشاء تقرير البيئة..."

cat > audit/reports/env/environment-report.md << EOF
# تقرير إعداد البيئة - SynapsePay

## معلومات عامة
- **التاريخ**: $(date)
- **نظام التشغيل**: $(uname -s)
- **المعمارية**: $(uname -m)
- **المستخدم**: $(whoami)

## حالة الأدوات

$TOOLS_STATUS

## إعدادات Solana
- **RPC URL**: $CURRENT_RPC
- **المحفظة**: $CURRENT_WALLET
- **العنوان**: $(solana address -k "$CURRENT_WALLET" 2>/dev/null || echo "غير متوفر")
- **الرصيد**: $(solana balance "$WALLET_ADDRESS" --url "$CURRENT_RPC" 2>/dev/null || echo "غير متوفر")

## Program IDs
- **Registry**: $(solana address -k target/deploy/synapsepay_registry-keypair.json 2>/dev/null || echo "غير متوفر")
- **Payments**: $(solana address -k target/deploy/synapsepay_payments-keypair.json 2>/dev/null || echo "غير متوفر")
- **Scheduler**: $(solana address -k target/deploy/synapsepay_scheduler-keypair.json 2>/dev/null || echo "غير متوفر")

## متغيرات البيئة
$(if [ -z "$MISSING_VARS" ]; then
    echo "✅ جميع المتغيرات المطلوبة موجودة"
else
    echo "⚠️ متغيرات مفقودة أو تحتاج تحديث: $MISSING_VARS"
fi)

## التوصيات
$(if [ -z "$MISSING_VARS" ]; then
    echo "- البيئة جاهزة للتطوير والاختبار"
    echo "- يمكن المتابعة لمرحلة النشر"
else
    echo "- حدث المتغيرات المفقودة في ملف .env"
    echo "- تأكد من صحة إعدادات المحفظة"
fi)
- تأكد من وجود رصيد كافي في المحفظة للنشر
- احفظ نسخة احتياطية من ملفات المفاتيح

## أوامر مفيدة

\`\`\`bash
# طلب SOL من faucet (devnet)
solana airdrop 2

# عرض معلومات المحفظة
solana address
solana balance

# تغيير الشبكة
solana config set --url devnet
solana config set --url mainnet-beta

# عرض الإعدادات الحالية
solana config get
\`\`\`
EOF

# طباعة النتائج النهائية
echo ""
echo "⚙️ ملخص إعداد البيئة:"
echo "========================"
echo -e "$TOOLS_STATUS"
echo ""

if [ -z "$MISSING_VARS" ]; then
    print_success "🎉 البيئة جاهزة بالكامل!"
    print_info "ملف .env تم إنشاؤه مع جميع المتغيرات المطلوبة"
    print_info "تقرير مفصل متوفر في: audit/reports/env/environment-report.md"
    exit 0
else
    print_warning "⚠️ البيئة تحتاج بعض التحديثات"
    print_warning "متغيرات تحتاج مراجعة: $MISSING_VARS"
    print_info "راجع ملف .env وحدث القيم المطلوبة"
    exit 1
fi