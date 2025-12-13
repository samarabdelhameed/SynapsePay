#!/bin/bash
# SynapsePay Smart Contract Verification Script
# Run this script to verify all contracts on Solana Explorer

set -e

echo "🔍 SynapsePay Contract Verification"
echo "===================================="
echo ""

# Check if solana-verify is installed
if ! command -v solana-verify &> /dev/null; then
    echo "Installing solana-verify..."
    cargo install solana-verify
fi

# Check Docker
if ! docker ps &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi

echo "✅ Docker is running"
echo ""

COMMIT_HASH="06c93de1ef41b80c5d281a9928c3672084edb177"
REPO_URL="https://github.com/samarabdelhameed/SynapsePay"
RPC_URL="https://api.devnet.solana.com"

# Registry
echo "📦 Verifying synapsepay_registry..."
solana-verify verify-from-repo \
  --url $RPC_URL \
  --program-id 5w8vTt1AUo67nE9bWA5e9Sh28HXtJJZaqiPj53n6wcby \
  --library-name synapsepay_registry \
  --commit-hash $COMMIT_HASH \
  $REPO_URL -y

echo ""
echo "📦 Verifying synapsepay_payments..."
solana-verify verify-from-repo \
  --url $RPC_URL \
  --program-id 8yzR2Ze7t8NjH9b9wUUaUxkHLcrfogWqAzqbMSb1vZgP \
  --library-name synapsepay_payments \
  --commit-hash $COMMIT_HASH \
  $REPO_URL -y

echo ""
echo "📦 Verifying synapsepay_scheduler..."
solana-verify verify-from-repo \
  --url $RPC_URL \
  --program-id 8NWxX7CDYhpfWAG5Dd6UJQ4EU1Ykrid8CoJ48Kp8MjsY \
  --library-name synapsepay_scheduler \
  --commit-hash $COMMIT_HASH \
  $REPO_URL -y

echo ""
echo "✅ All contracts verified!"
echo ""
echo "Check verification status at:"
echo "  - https://explorer.solana.com/address/5w8vTt1AUo67nE9bWA5e9Sh28HXtJJZaqiPj53n6wcby?cluster=devnet"
echo "  - https://explorer.solana.com/address/8yzR2Ze7t8NjH9b9wUUaUxkHLcrfogWqAzqbMSb1vZgP?cluster=devnet"
echo "  - https://explorer.solana.com/address/8NWxX7CDYhpfWAG5Dd6UJQ4EU1Ykrid8CoJ48Kp8MjsY?cluster=devnet"
