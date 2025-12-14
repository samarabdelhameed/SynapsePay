# 🚀 SynapsePay Deployment Guide

## Quick Deploy to Vercel (Frontend)

### Option 1: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/samarabdelhameed/SynapsePay)

### Option 2: Manual Deploy

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy (from project root)
vercel

# For production:
vercel --prod
```

---

## Environment Variables for Vercel

When deploying, set these environment variables in Vercel dashboard:

| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_SOLANA_NETWORK` | `devnet` | Solana network |
| `VITE_SOLANA_RPC_URL` | `https://api.devnet.solana.com` | RPC endpoint |
| `VITE_FACILITATOR_URL` | Your deployed facilitator URL | X402 Facilitator |
| `VITE_RESOURCE_SERVER_URL` | Your deployed resource server URL | AI Agent Server |
| `VITE_ACTIONS_API_URL` | Your deployed actions API URL | Solana Actions |
| `VITE_REGISTRY_PROGRAM_ID` | `5w8vTt1AUo67nE9bWA5e9Sh28HXtJJZaqiPj53n6wcby` | Registry Program |
| `VITE_PAYMENTS_PROGRAM_ID` | `8yzR2Ze7t8NjH9b9wUUaUxkHLcrfogWqAzqbMSb1vZgP` | Payments Program |
| `VITE_SCHEDULER_PROGRAM_ID` | `8NWxX7CDYhpfWAG5Dd6UJQ4EU1Ykrid8CoJ48Kp8MjsY` | Scheduler Program |

---

## Backend Deployment (Render/Railway)

### Deploy X402 Facilitator to Render

1. Create new Web Service on Render
2. Connect GitHub repo
3. Set:
   - **Build Command**: `cd apps/x402-facilitator && npm install && npm run build`
   - **Start Command**: `cd apps/x402-facilitator && npm start`
   - **Root Directory**: `/`

**Environment Variables:**
```bash
FACILITATOR_PRIVATE_KEY=<your-base58-private-key>
FACILITATOR_PORT=8403
SOLANA_RPC_URL=https://api.devnet.solana.com
USDC_MINT_ADDRESS=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
FACILITATOR_FEE_BPS=500
NODE_ENV=production
```

### Deploy Resource Server to Render

1. Create new Web Service on Render
2. Set:
   - **Build Command**: `cd apps/resource-server && npm install && npm run build`
   - **Start Command**: `cd apps/resource-server && npm start`

**Environment Variables:**
```bash
RESOURCE_SERVER_PORT=8404
FACILITATOR_URL=https://your-facilitator.onrender.com
NODE_ENV=production
```

### Deploy Actions API to Render

1. Create new Web Service on Render
2. Set:
   - **Build Command**: `cd apps/actions-api && npm install && npm run build`
   - **Start Command**: `cd apps/actions-api && npm start`

**Environment Variables:**
```bash
ACTIONS_API_PORT=8405
BASE_URL=https://your-actions-api.onrender.com
NODE_ENV=production
```

---

## Local Development Quick Start

```bash
# Terminal 1: Frontend
cd apps/web && npm run dev

# Terminal 2: X402 Facilitator
cd apps/x402-facilitator && FACILITATOR_PORT=4021 npm run dev

# Terminal 3: Resource Server
cd apps/resource-server && RESOURCE_SERVER_PORT=4020 npm run dev

# Terminal 4: Actions API
cd apps/actions-api && ACTIONS_API_PORT=8405 npm run dev
```

---

## Deployed Contract Addresses (Devnet)

| Contract | Program ID | Explorer |
|----------|-----------|----------|
| **Registry** | `5w8vTt1AUo67nE9bWA5e9Sh28HXtJJZaqiPj53n6wcby` | [View](https://explorer.solana.com/address/5w8vTt1AUo67nE9bWA5e9Sh28HXtJJZaqiPj53n6wcby?cluster=devnet) |
| **Payments** | `8yzR2Ze7t8NjH9b9wUUaUxkHLcrfogWqAzqbMSb1vZgP` | [View](https://explorer.solana.com/address/8yzR2Ze7t8NjH9b9wUUaUxkHLcrfogWqAzqbMSb1vZgP?cluster=devnet) |
| **Scheduler** | `8NWxX7CDYhpfWAG5Dd6UJQ4EU1Ykrid8CoJ48Kp8MjsY` | [View](https://explorer.solana.com/address/8NWxX7CDYhpfWAG5Dd6UJQ4EU1Ykrid8CoJ48Kp8MjsY?cluster=devnet) |

---

## Pre-Deployment Checklist

### Frontend
- [ ] All environment variables set
- [ ] Build passes: `cd apps/web && npm run build`
- [ ] No TypeScript errors: `npm run typecheck`

### Backend Services
- [ ] Facilitator wallet has SOL for gas
- [ ] Private key is correctly encoded (base58)
- [ ] Health endpoints respond

### Testing
- [ ] Wallet connection works
- [ ] Payment flow completes
- [ ] Solana Explorer links work

---

## Demo Recording Setup

Before recording the demo video:

1. **Start all services locally** (see commands above)
2. **Prepare Phantom wallet**:
   - Switch to Devnet
   - Get test SOL from [faucet](https://solfaucet.com)
   - Get test USDC (or use demo mode)

3. **Recording software**:
   - OBS Studio or Loom
   - Set resolution to 1080p
   - Test audio

4. **Follow the script**: See `DEMO_VIDEO_SCRIPT.md`

---

*Built for Solana Winter Buildathon 2025*
