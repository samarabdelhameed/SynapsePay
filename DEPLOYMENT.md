# 🚀 SynapsePay Deployment Guide

## 📋 Deployed Smart Contracts (Solana Devnet)

All SynapsePay contracts are deployed and verified on Solana Devnet.

| Contract | Program ID | Status | Explorer |
|----------|-----------|--------|----------|
| **Registry** | `5w8vTt1AUo67nE9bWA5e9Sh28HXtJJZaqiPj53n6wcby` | ✅ Live | [View →](https://explorer.solana.com/address/5w8vTt1AUo67nE9bWA5e9Sh28HXtJJZaqiPj53n6wcby?cluster=devnet) |
| **Payments** | `8yzR2Ze7t8NjH9b9wUUaUxkHLcrfogWqAzqbMSb1vZgP` | ✅ Live | [View →](https://explorer.solana.com/address/8yzR2Ze7t8NjH9b9wUUaUxkHLcrfogWqAzqbMSb1vZgP?cluster=devnet) |
| **Scheduler** | `8NWxX7CDYhpfWAG5Dd6UJQ4EU1Ykrid8CoJ48Kp8MjsY` | ✅ Live | [View →](https://explorer.solana.com/address/8NWxX7CDYhpfWAG5Dd6UJQ4EU1Ykrid8CoJ48Kp8MjsY?cluster=devnet) |

---

## 🌐 Frontend Deployment (Vercel)

### Option 1: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/samarabdelhameed/SynapsePay)

### Option 2: CLI Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Environment Variables (Vercel Dashboard)

| Variable | Value |
|----------|-------|
| `VITE_SOLANA_NETWORK` | `devnet` |
| `VITE_SOLANA_RPC_URL` | `https://api.devnet.solana.com` |
| `VITE_REGISTRY_PROGRAM_ID` | `5w8vTt1AUo67nE9bWA5e9Sh28HXtJJZaqiPj53n6wcby` |
| `VITE_PAYMENTS_PROGRAM_ID` | `8yzR2Ze7t8NjH9b9wUUaUxkHLcrfogWqAzqbMSb1vZgP` |
| `VITE_SCHEDULER_PROGRAM_ID` | `8NWxX7CDYhpfWAG5Dd6UJQ4EU1Ykrid8CoJ48Kp8MjsY` |

---

## 🔧 Backend Deployment (Render)

### X402 Facilitator

**Build Command:** `cd apps/x402-facilitator && npm install && npm run build`  
**Start Command:** `cd apps/x402-facilitator && npm start`

```bash
# Environment Variables
FACILITATOR_PRIVATE_KEY=<your-base58-private-key>
FACILITATOR_PORT=8403
SOLANA_RPC_URL=https://api.devnet.solana.com
USDC_MINT_ADDRESS=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
FACILITATOR_FEE_BPS=500
```

### Resource Server

**Build Command:** `cd apps/resource-server && npm install && npm run build`  
**Start Command:** `cd apps/resource-server && npm start`

```bash
RESOURCE_SERVER_PORT=8404
FACILITATOR_URL=https://your-facilitator.onrender.com
```

### Actions API

**Build Command:** `cd apps/actions-api && npm install && npm run build`  
**Start Command:** `cd apps/actions-api && npm start`

```bash
ACTIONS_API_PORT=8405
BASE_URL=https://your-actions-api.onrender.com
```

---

## 💻 Local Development

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

## 🔍 Verify Contracts

```bash
# Set network to devnet
solana config set --url devnet

# View contract info
solana program show 5w8vTt1AUo67nE9bWA5e9Sh28HXtJJZaqiPj53n6wcby
solana program show 8yzR2Ze7t8NjH9b9wUUaUxkHLcrfogWqAzqbMSb1vZgP
solana program show 8NWxX7CDYhpfWAG5Dd6UJQ4EU1Ykrid8CoJ48Kp8MjsY
```

---

## 📦 Using Contracts in Code

```typescript
import { PublicKey } from '@solana/web3.js';

const REGISTRY_PROGRAM_ID = new PublicKey('5w8vTt1AUo67nE9bWA5e9Sh28HXtJJZaqiPj53n6wcby');
const PAYMENTS_PROGRAM_ID = new PublicKey('8yzR2Ze7t8NjH9b9wUUaUxkHLcrfogWqAzqbMSb1vZgP');
const SCHEDULER_PROGRAM_ID = new PublicKey('8NWxX7CDYhpfWAG5Dd6UJQ4EU1Ykrid8CoJ48Kp8MjsY');
```

---

## ✅ Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] `npm run build` passes without errors
- [ ] Facilitator wallet has SOL for gas fees
- [ ] Health endpoints respond (`/health`)
- [ ] Wallet connection works
- [ ] Payment flow completes successfully

---

*Built for Solana Winter Buildathon 2025*
