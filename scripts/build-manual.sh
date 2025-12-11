#!/bin/bash

# 🚀 Manual build script for SynapsePay programs
# This bypasses Anchor's toolchain issues

set -e

echo "🔧 Manual build for SynapsePay programs..."

# Build each program individually using cargo
programs=("synapsepay-registry" "synapsepay-payments" "synapsepay-scheduler")

for program in "${programs[@]}"; do
    echo "🔨 Building $program..."
    
    cd "programs/$program"
    
    # Use system cargo with SBF target
    cargo build-sbf --manifest-path Cargo.toml
    
    cd "../.."
    
    echo "✅ $program built successfully"
done

echo "🎉 All programs built!"

# Copy to target/deploy for Anchor compatibility
mkdir -p target/deploy
cp target/sbf-solana-solana/release/*.so target/deploy/ 2>/dev/null || true

echo "📁 Programs available in target/deploy/"
ls -la target/deploy/