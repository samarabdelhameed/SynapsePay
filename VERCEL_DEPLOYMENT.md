# 🚀 Vercel Deployment Guide for SynapsePay

## Quick Deploy to Vercel

### Option 1: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fsamarabdelhameed%2FSynapsePay)

### Option 2: CLI Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from project root
cd /path/to/SynapsePay
vercel

# For production deployment
vercel --prod
```

---

## 📋 Pre-Deployment Checklist

### Environment Variables (Required on Vercel)

| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_SOLANA_NETWORK` | `devnet` | Solana network |
| `VITE_SOLANA_RPC_URL` | `https://api.devnet.solana.com` | Solana RPC endpoint |
| `VITE_FACILITATOR_URL` | `https://synapsepay-facilitator.onrender.com` | X402 Facilitator |
| `VITE_RESOURCE_SERVER_URL` | `https://synapsepay-resource.onrender.com` | Resource Server |
| `VITE_ACTIONS_API_URL` | `https://synapsepay-actions.onrender.com` | Actions API |
| `VITE_REGISTRY_PROGRAM_ID` | `5w8vTt1AUo67nE9bWA5e9Sh28HXtJJZaqiPj53n6wcby` | Registry Program |
| `VITE_PAYMENTS_PROGRAM_ID` | `8yzR2Ze7t8NjH9b9wUUaUxkHLcrfogWqAzqbMSb1vZgP` | Payments Program |
| `VITE_SCHEDULER_PROGRAM_ID` | `8NWxX7CDYhpfWAG5Dd6UJQ4EU1Ykrid8CoJ48Kp8MjsY` | Scheduler Program |

---

## 🔧 Vercel Configuration

The `vercel.json` file is already configured:

```json
{
    "name": "synapsepay",
    "buildCommand": "cd apps/web && npm install && npm run build",
    "outputDirectory": "apps/web/dist",
    "rewrites": [
        { "source": "/(.*)", "destination": "/index.html" }
    ]
}
```

---

## 🌐 Backend Deployment (Recommended: Render.com)

### X402 Facilitator Service

```yaml
# render.yaml
services:
  - type: web
    name: synapsepay-facilitator
    env: node
    buildCommand: cd apps/x402-facilitator && npm install && npm run build
    startCommand: cd apps/x402-facilitator && npm start
    envVars:
      - key: FACILITATOR_PORT
        value: 4021
      - key: FACILITATOR_PRIVATE_KEY
        sync: false  # Set manually in Render dashboard
      - key: SOLANA_RPC_URL
        value: https://api.devnet.solana.com
      - key: USDC_MINT_ADDRESS
        value: 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
```

### Resource Server

```yaml
  - type: web
    name: synapsepay-resource
    env: node
    buildCommand: cd apps/resource-server && npm install && npm run build
    startCommand: cd apps/resource-server && npm start
    envVars:
      - key: RESOURCE_SERVER_PORT
        value: 4020
```

### Actions API

```yaml
  - type: web
    name: synapsepay-actions
    env: node
    buildCommand: cd apps/actions-api && npm install && npm run build
    startCommand: cd apps/actions-api && npm start
    envVars:
      - key: ACTIONS_API_PORT
        value: 8405
```

---

## 📸 Local Demo (For Screenshots/Video)

If you can't deploy publicly, record a demo video with local services:

```bash
# Terminal 1: Frontend
cd apps/web && npm run dev
# → http://localhost:5173

# Terminal 2: X402 Facilitator
cd apps/x402-facilitator && npm run dev
# → http://localhost:4021

# Terminal 3: Resource Server
cd apps/resource-server && npm run dev
# → http://localhost:4020

# Terminal 4: Actions API
cd apps/actions-api && npm run dev
# → http://localhost:8405
```

---

## 🎬 Recording Demo Video (Alternative to Public URL)

Use one of these tools to record your demo:

| Tool | Best For | Platform |
|------|----------|----------|
| **Loom** | Quick recording with webcam | Chrome Extension |
| **OBS Studio** | Professional recording | Windows/Mac/Linux |
| **ScreenFlow** | Mac-native, polished output | Mac only |
| **QuickTime** | Simple, built-in | Mac only |

### Recording Tips

1. **Resolution**: 1920x1080 (1080p)
2. **Browser**: Use Chrome/Brave with Phantom installed
3. **Clean UI**: Close unnecessary tabs/apps
4. **Audio**: Use a good microphone for voiceover
5. **Duration**: 2-4 minutes optimal

---

## 🔗 Expected Public URLs

After deployment, your URLs will be:

| Service | URL |
|---------|-----|
| **Frontend** | `https://synapsepay.vercel.app` |
| **Facilitator** | `https://synapsepay-facilitator.onrender.com` |
| **Resource** | `https://synapsepay-resource.onrender.com` |
| **Actions API** | `https://synapsepay-actions.onrender.com` |

---

## ✅ Post-Deployment Verification

```bash
# Test frontend
curl https://synapsepay.vercel.app

# Test facilitator health
curl https://synapsepay-facilitator.onrender.com/health

# Test resource server health
curl https://synapsepay-resource.onrender.com/health

# Test actions API health
curl https://synapsepay-actions.onrender.com/health
```

---

## 🏆 For Hackathon Submission

Even without public deployment, you can submit with:

1. **Demo Video** (2-4 min) - Most important!
2. **GitHub Repository** with full source code
3. **Screenshots** of running application
4. **Local demo** instructions in README

---

*Last Updated: December 14, 2025*
