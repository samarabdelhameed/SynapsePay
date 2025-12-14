# 🧪 SynapsePay Quick Test Guide

## Before Demo Recording - Test Everything!

This guide helps you verify all functionality works before recording the demo video.

---

## 📋 Pre-Test Checklist

### 1. Wallet Setup
- [ ] Phantom or Solflare installed
- [ ] Wallet set to **Devnet** network
- [ ] Has at least 0.5 SOL (for fees)
- [ ] Has at least 1 USDC (for payments)

**Get Devnet SOL:**
```bash
# Using Solana CLI
solana airdrop 2 --url devnet

# Or visit: https://solfaucet.com
```

---

## 🚀 Start All Services

Open 4 terminal windows:

### Terminal 1: Frontend
```bash
cd /Users/s/Solana-SynapsePay/apps/web
npm run dev
# → http://localhost:5173
```

### Terminal 2: X402 Facilitator
```bash
cd /Users/s/Solana-SynapsePay/apps/x402-facilitator
FACILITATOR_PORT=4021 npm run dev
# → http://localhost:4021
```

### Terminal 3: Resource Server
```bash
cd /Users/s/Solana-SynapsePay/apps/resource-server
RESOURCE_SERVER_PORT=4020 npm run dev
# → http://localhost:4020
```

### Terminal 4: Actions API
```bash
cd /Users/s/Solana-SynapsePay/apps/actions-api
ACTIONS_API_PORT=8405 npm run dev
# → http://localhost:8405
```

---

## ✅ Test Checklist

### 1. Health Check All Services

```bash
# Check Frontend
curl http://localhost:5173

# Check Facilitator
curl http://localhost:4021/health

# Check Resource Server
curl http://localhost:4020/health

# Check Actions API
curl http://localhost:8405/health
```

Expected: All should return `200 OK`

---

### 2. Test Wallet Connection

1. Open http://localhost:5173
2. Click "Connect Wallet"
3. Select Phantom
4. Approve connection
5. ✅ Wallet address shows in navbar

---

### 3. Test Marketplace

1. Go to http://localhost:5173/marketplace
2. Verify all agents load
3. Try search and filtering
4. Click on "PDF Summarizer"
5. ✅ Agent details page loads

---

### 4. Test Payment Flow (Most Important!)

1. On Agent Details page, click **"Pay & Run"**
2. Watch the 4-step payment modal:
   - `📝 Create Invoice` → should complete
   - `✍️ Sign Intent` → Phantom popup appears
   - `⚡ Settlement` → Submits to Solana
   - `🤖 Execute Task` → Agent runs
3. On success:
   - 🎉 Confetti animation
   - ✅ Transaction signature shown
   - 🔗 "View on Solana Explorer" button works

**Test Clicks:**
- [ ] "Solana Explorer" link opens correctly
- [ ] "Solscan" link opens correctly
- [ ] Close button works

---

### 5. Test IoT Devices Page

1. Go to http://localhost:5173/devices
2. Verify device cards load
3. Click on "UGV Rover"
4. Check control panel appears
5. ✅ "Rent Now" button is visible

---

### 6. Test Dashboard

1. Go to http://localhost:5173/dashboard
2. Verify stats cards load
3. Check charts render
4. ✅ Recent activity shows

---

### 7. Test Onboarding Guide

1. Go to http://localhost:5173
2. Click the floating **❓** button (bottom right)
3. Walk through all 5 steps
4. ✅ "Start Exploring" closes the guide

---

## 🎥 Ready for Recording?

If all tests pass:
1. ✅ Clear browser cache
2. ✅ Close unnecessary tabs
3. ✅ Hide sensitive information
4. ✅ Set screen resolution to 1920x1080
5. ✅ Start recording software
6. ✅ Follow `DEMO_VIDEO_SCRIPT.md`

---

## 🔧 Common Issues & Fixes

### "Wallet not connected"
- Make sure Phantom is unlocked
- Check network is Devnet
- Try disconnecting and reconnecting

### "Payment failed"
- Check Facilitator is running (port 4021)
- Check you have enough USDC
- Look at Facilitator terminal for errors

### "Agent execution failed"
- Check Resource Server is running (port 4020)
- Check terminal logs for errors

### "Transaction not found on Explorer"
- Make sure you're viewing Devnet cluster
- Transaction may take a few seconds to appear

---

## 📊 API Quick Tests

```bash
# Get agents list
curl http://localhost:8405/agents | jq

# Create test invoice
curl -X POST http://localhost:4021/invoice \
  -H "Content-Type: application/json" \
  -d '{"agentId":"pdf-summarizer-v1","payer":"YourWalletAddress"}' | jq

# Check actions manifest
curl http://localhost:8405/actions.json | jq
```

---

## 🏆 Success Criteria

Before recording the demo, verify:

| Test | Status |
|------|--------|
| Frontend loads | ⬜ |
| Wallet connects | ⬜ |
| Payment completes | ⬜ |
| Solana Explorer shows tx | ⬜ |
| Confetti animation works | ⬜ |
| IoT devices page works | ⬜ |
| Dashboard loads | ⬜ |
| Onboarding guide works | ⬜ |

---

*Good luck with the recording! 🎬*
