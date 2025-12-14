# 📋 SynapsePay Demo Recording Checklist

## Pre-Recording Setup

### ✅ Environment Verification
- [x] Frontend running on http://localhost:5173/
- [x] All pages verified and working:
  - [x] Homepage (/)
  - [x] Marketplace (/marketplace)
  - [x] Agent Details (/agent/pdf-summarizer-v1)
  - [x] IoT Devices (/devices)
  - [x] Dashboard (/dashboard)

### ⚙️ Technical Requirements
- [ ] Phantom wallet installed in browser
- [ ] Wallet connected to **Devnet**
- [ ] Wallet has SOL balance (> 0.5 SOL)
- [ ] Wallet has USDC balance (> 1 USDC)
- [ ] Screen resolution: 1920x1080 or higher

---

## 🎬 Recording Commands

### Start Frontend (if not running)
```bash
cd /Users/s/Solana-SynapsePay/apps/web
npm run dev
```

### Check Wallet Balance (Terminal)
```bash
solana balance --url devnet
```

---

## 📷 Demo Assets

### Architecture Diagram
```
/Users/s/Solana-SynapsePay/docs/architecture_diagram.png
```

### Screenshots Captured
| Page | File |
|------|------|
| Homepage | `homepage_loaded.png` |
| Marketplace | `marketplace_page.png` |
| Agent Details | `agent_details_page.png` |
| IoT Devices | `iot_devices_page.png` |
| Dashboard | `dashboard_page.png` |

---

## 🔗 Important Links for Demo

### Live Demo
```
https://synapsepay-demo.surge.sh
```

### Local Demo
```
http://localhost:5173/
```

### Solana Explorer Links (Devnet)

| Program | Explorer Link |
|---------|---------------|
| **Registry** | https://explorer.solana.com/address/5w8vTt1AUo67nE9bWA5e9Sh28HXtJJZaqiPj53n6wcby?cluster=devnet |
| **Payments** | https://explorer.solana.com/address/8yzR2Ze7t8NjH9b9wUUaUxkHLcrfogWqAzqbMSb1vZgP?cluster=devnet |
| **Scheduler** | https://explorer.solana.com/address/8NWxX7CDYhpfWAG5Dd6UJQ4EU1Ykrid8CoJ48Kp8MjsY?cluster=devnet |

### GitHub Repository
```
https://github.com/SamarAbdelhameed/SynapsePay
```

---

## 🎤 Key Talking Points

### X402 Benefits (Mention These!)
1. **"Gasless for users"** - User signs messages, not transactions
2. **"On-chain settlement"** - Real USDC transfers on Solana
3. **"Micropayments enabled"** - Pay 5 cents for a task
4. **"Verified contracts"** - All programs deployed on devnet

### Technical Stack (Mention These!)
1. **Frontend**: React + Vite + Solana Wallet Adapter
2. **Backend**: X402 Facilitator (Node.js)
3. **Smart Contracts**: 3 Anchor programs on Solana
4. **Protocol**: X402 for gasless micropayments

---

## 📖 Demo Script Reference
See: `DEMO_VIDEO_SCRIPT.md`

---

## 🎯 Hackathon Tracks
- **Best Consumer App on Solana**
- **Best Use of X402 with Solana**

---

**Ready to record? Good luck! 🚀**
