#!/bin/bash

# 🚀 SynapsePay - Build Script using Solana SBF Toolchain
# This script builds Anchor programs using the correct SBF toolchain

set -e

echo "🔧 Building SynapsePay Anchor Programs..."
echo "Using Solana SBF Unified Toolchain"

# Check Solana version
echo "📋 Solana Version:"
solana --version

# Check Anchor version  
echo "📋 Anchor Version:"
anchor --version

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf target/
rm -rf .anchor/

# Build using Anchor (it will use Solana's SBF toolchain)
echo "🔨 Building programs..."

# Set environment variables for SBF build
export RUST_LOG=error
export ANCHOR_WALLET=~/.config/solana/id.json

# Try building with verbose output to see what's happening
anchor build --verbose

echo "✅ Build completed successfully!"
echo "📁 Programs built in: target/deploy/"

# List built programs
echo "📋 Built programs:"
ls -la target/deploy/*.so 2>/dev/null || echo "No .so files found"

echo "🎉 Ready for deployment!"