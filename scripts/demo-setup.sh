#!/bin/bash

# 🚀 SynapsePay Demo Setup
# This script prepares the project for GitHub upload and demo

set -e

echo "🔧 Setting up SynapsePay for demo..."

# 1. Clean any build artifacts
echo "🧹 Cleaning build artifacts..."
rm -rf target/
rm -rf .anchor/
rm -rf node_modules/.cache/

# 2. Install dependencies
echo "📦 Installing dependencies..."
bun install

# 3. Build frontend only (skip Anchor programs for now)
echo "🎨 Building frontend..."
cd apps/web
bun run build
cd ../..

# 4. Create demo program IDs (for frontend demo)
echo "📋 Setting up demo program IDs..."

# Update .env.example with working demo values
cat > .env.example << 'EOF'
# ═══════════════════════════════════════════════════════════════
# 🚀 SYNAPSEPAY DEMO CONFIGURATION
# ═══════════════════════════════════════════════════════════════
# Copy this file to .env and fill in your values

# ⛓️ SOLANA CONFIGURATION
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com

# Demo Program IDs (for frontend demo)
REGISTRY_PROGRAM_ID=SYNRegistry111111111111111111111111111111111
PAYMENTS_PROGRAM_ID=SYNPayments111111111111111111111111111111111
SCHEDULER_PROGRAM_ID=SYNScheduler11111111111111111111111111111111

# USDC Token Mint (Devnet)
USDC_MINT_ADDRESS=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU

# 💳 BACKEND SERVICES
FACILITATOR_PORT=8403
RESOURCE_SERVER_PORT=8404
ACTIONS_API_PORT=8405

# 🎨 FRONTEND (VITE_* prefix required)
VITE_SOLANA_NETWORK=devnet
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
VITE_FACILITATOR_URL=http://localhost:8403
VITE_RESOURCE_SERVER_URL=http://localhost:8404
VITE_ACTIONS_API_URL=http://localhost:8405

# Demo mode (no real AI keys needed)
DEMO_MODE=true
VITE_DEMO_MODE=true

# Optional: Add your keys for full functionality
OPENAI_API_KEY=your-openai-key-here
ANTHROPIC_API_KEY=your-anthropic-key-here
EOF

echo "✅ Demo setup completed!"
echo ""
echo "🎯 Next steps:"
echo "1. Copy .env.example to .env"
echo "2. Run: bun run dev"
echo "3. Open: http://localhost:5174"
echo ""
echo "📋 For GitHub upload:"
echo "- All sensitive files are in .gitignore"
echo "- Frontend demo works without Anchor programs"
echo "- Backend services run in demo mode"