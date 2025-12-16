# 🚀 Backend Deployment Guide

This guide covers deploying SynapsePay's backend services to production.

## 📋 Services Overview

| Service | Purpose | Recommended Platform |
|---------|---------|---------------------|
| **Resource Server** | AI agent execution, database | Railway / Render |
| **X402 Facilitator** | Payment processing | Railway / Render |
| **Actions API** | Solana Blinks | Railway / Render |
| **Frontend** | React Web App | Vercel (already deployed) |

## 🛤️ Deploy to Railway (Recommended)

### 1. Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Create a new project

### 2. Deploy Resource Server

```bash
# From project root
cd apps/resource-server

# Create railway.json
cat > railway.json << EOF
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "bun run start",
    "healthcheckPath": "/health"
  }
}
EOF
```

In Railway Dashboard:
1. Click **New Service** → **GitHub Repo**
2. Select your SynapsePay repository
3. Set **Root Directory**: `apps/resource-server`
4. Add environment variables:

```bash
PORT=8404
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

5. Deploy!

### 3. Deploy X402 Facilitator

Same process for `apps/x402-facilitator`:

```bash
# Environment variables
PORT=8403
SOLANA_RPC_URL=https://api.devnet.solana.com
FACILITATOR_PRIVATE_KEY=your-base58-private-key
USDC_MINT_ADDRESS=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
FACILITATOR_FEE_BPS=500
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
```

### 4. Deploy Actions API

Same process for `apps/actions-api`:

```bash
# Environment variables
PORT=8405
RESOURCE_SERVER_URL=https://your-resource-server.railway.app
FACILITATOR_URL=https://your-facilitator.railway.app
ACTIONS_BASE_URL=https://your-actions-api.railway.app
```

### 5. Update Frontend Environment

After deploying backends, update Vercel environment variables:

```bash
VITE_FACILITATOR_URL=https://your-facilitator.railway.app
VITE_RESOURCE_SERVER_URL=https://your-resource-server.railway.app
VITE_ACTIONS_API_URL=https://your-actions-api.railway.app
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Then redeploy the frontend on Vercel.

---

## 🌊 Alternative: Deploy to Render

### Create render.yaml

```yaml
services:
  - type: web
    name: synapsepay-resource
    env: node
    buildCommand: cd apps/resource-server && bun install
    startCommand: cd apps/resource-server && bun run start
    healthCheckPath: /health
    envVars:
      - key: PORT
        value: 8404
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_SERVICE_KEY
        sync: false
      - key: OPENAI_API_KEY
        sync: false

  - type: web
    name: synapsepay-facilitator
    env: node
    buildCommand: cd apps/x402-facilitator && bun install
    startCommand: cd apps/x402-facilitator && bun run start
    healthCheckPath: /health
    envVars:
      - key: PORT
        value: 8403
      - key: SOLANA_RPC_URL
        value: https://api.devnet.solana.com
      - key: FACILITATOR_PRIVATE_KEY
        sync: false
```

---

## 🔑 Creating Facilitator Wallet

The facilitator needs a funded wallet to pay gas fees:

```bash
# Generate new keypair
solana-keygen new -o facilitator-keypair.json

# Get the private key in Base58 format
cat facilitator-keypair.json
# Use this as FACILITATOR_PRIVATE_KEY

# Fund with Devnet SOL
solana airdrop 2 $(solana-keygen pubkey facilitator-keypair.json) --url devnet

# Verify balance
solana balance $(solana-keygen pubkey facilitator-keypair.json) --url devnet
```

---

## ✅ Verify Deployment

### 1. Check Health Endpoints

```bash
# Resource Server
curl https://your-resource-server.railway.app/health

# Expected response:
{
  "status": "ok",
  "mode": "production",
  "database": true,
  "ai": { "openai": true, "anthropic": true }
}
```

```bash
# Facilitator
curl https://your-facilitator.railway.app/health
```

### 2. Test Agent List

```bash
curl https://your-resource-server.railway.app/agents

# Expected: Real agents from Supabase with source: "database"
```

### 3. Test Frontend

1. Go to https://synapsepay.vercel.app
2. Open browser console
3. Navigate to Marketplace
4. Check for `[useAgents] Loaded from Supabase` log

---

## 🔧 Troubleshooting

### "Database connection failed"
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are correct
- Check that RLS policies allow service role access

### "AI execution failed"
- Verify `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` are valid
- Check that API keys have sufficient quota

### "Facilitator wallet error"
- Ensure wallet has enough SOL for gas (~0.5 SOL)
- Check `FACILITATOR_PRIVATE_KEY` is valid Base58

### CORS errors
- Add your frontend URL to CORS allowlist
- Check `CORS_ALLOWED_ORIGINS` environment variable

---

## 📊 Monitoring

Railway and Render both provide:
- **Logs**: Real-time and historical
- **Metrics**: CPU, Memory, Network
- **Alerts**: Configure for downtime

Set up alerts for:
- Health check failures
- High error rates
- Memory/CPU spikes

---

## 💰 Cost Estimation

| Platform | Free Tier | Paid |
|----------|-----------|------|
| Railway | $5/month credit | $0.000463/min |
| Render | 750 hours free | $7/month starter |
| Supabase | 500MB DB free | $25/month pro |
| Vercel | Unlimited static | Free for hobby |

**Estimated monthly cost for production: $20-50**
