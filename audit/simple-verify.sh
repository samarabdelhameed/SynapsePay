#!/bin/bash

echo "📋 التحقق من العقود المنشورة..."

# قائمة العقود
CONTRACTS=("synapsepay-registry" "synapsepay-payments" "synapsepay-scheduler")

mkdir -p audit/reports/verification

verified_count=0
total_count=${#CONTRACTS[@]}

echo "## تقرير التحقق - SynapsePay" > audit/reports/verification/simple-report.md
echo "" >> audit/reports/verification/simple-report.md
echo "| العقد | Program ID | حالة التحقق |" >> audit/reports/verification/simple-report.md
echo "|-------|------------|-------------|" >> audit/reports/verification/simple-report.md

for contract in "${CONTRACTS[@]}"; do
    keypair_file="target/deploy/${contract//-/_}-keypair.json"
    
    if [ -f "$keypair_file" ]; then
        program_id=$(solana address -k "$keypair_file")
        echo "🔍 التحقق من $contract: $program_id"
        
        # التحقق باستخدام solana CLI
        if solana program show "$program_id" &>/dev/null; then
            echo "✅ $contract - متحقق"
            echo "| $contract | \`$program_id\` | ✅ متحقق |" >> audit/reports/verification/simple-report.md
            verified_count=$((verified_count + 1))
        else
            echo "❌ $contract - فشل التحقق"
            echo "| $contract | \`$program_id\` | ❌ فشل |" >> audit/reports/verification/simple-report.md
        fi
    else
        echo "❌ $contract - ملف keypair غير موجود"
        echo "| $contract | غير متوفر | ❌ ملف مفقود |" >> audit/reports/verification/simple-report.md
    fi
done

echo "" >> audit/reports/verification/simple-report.md
echo "**النتيجة**: $verified_count/$total_count عقود متحققة" >> audit/reports/verification/simple-report.md

echo ""
echo "📊 النتائج:"
echo "العقود المتحققة: $verified_count/$total_count"
echo "معدل النجاح: $(( verified_count * 100 / total_count ))%"

if [ $verified_count -eq $total_count ]; then
    echo "🎉 جميع العقود متحققة!"
    exit 0
else
    echo "⚠️ بعض العقود لم يتم التحقق منها"
    exit 1
fi