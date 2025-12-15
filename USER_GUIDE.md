# 📱 SynapsePay - User Guide

## Comprehensive User Manual

---

## 🚀 Quick Start

### Live Demo
```
https://synapsepay.vercel.app
```

### Running Locally

```bash
# 1. Navigate to project folder
cd /path/to/SynapsePay

# 2. Start the Frontend
cd apps/web && npm run dev
```

### Local URL
```
http://localhost:5173/
```

---

## 📋 Available Scenarios

SynapsePay offers **3 main use cases**:

| Scenario | Usage | Example | Price |
|----------|-------|---------|-------|
| **AI Agents** | One-time tasks | PDF Summary, NFT Creation | 0.05 - 0.50 USDC |
| **IoT Devices** | Real-time control | Robot control, Smart lights | 0.05 - 0.50 USDC |
| **Subscriptions** | Scheduled recurring tasks | Daily reports, Backups | 0.01 - 0.10 USDC |

---

# 🤖 Scenario 1: AI Agents

## Goal
Execute an AI task (like PDF summarization) for instant USDC payment.

## Problem We Solve

| Traditional Solution | Issue |
|---------------------|-------|
| ChatGPT Plus subscription | $20/month for one task |
| API Keys setup | Complex configuration |
| Free services | Slow and limited |

**SynapsePay Solution**: Pay $0.05 → Upload PDF → Get summary in seconds

---

## Step-by-Step Guide

### Step 1️⃣ - Homepage

**URL:** `http://localhost:5173/`

**Action:** Click `🏪 Marketplace` in the sidebar or `Explore Marketplace` button

### Step 2️⃣ - Agent Marketplace

**URL:** `http://localhost:5173/marketplace`

**Available Agents:**

| Agent | Function | Price | Rating |
|-------|----------|-------|--------|
| 📄 PDF Summarizer | Summarize PDF files | 0.05 USDC | ⭐⭐⭐⭐⭐ |
| 🎨 NFT Minter | Convert image to NFT | 0.25 USDC | ⭐⭐⭐⭐ |
| 🐛 Code Debugger | Analyze and fix code | 0.10 USDC | ⭐⭐⭐⭐⭐ |
| 📊 Data Analyzer | Analyze data | 0.15 USDC | ⭐⭐⭐⭐ |

**Action:** Click `View Details` on `PDF Summarizer`

### Step 3️⃣ - Agent Details

**URL:** `http://localhost:5173/agent/pdf-summarizer`

**Agent Information:**
- Multi-language support
- Key points extraction
- Bullet-point formatting
- Supports documents up to 100 pages

**Action:** Click `🚀 Run Agent (0.05 USDC)`

### Step 4️⃣ - Upload & Pay

1. Upload your PDF file (max 100 pages, 10MB)
2. Click `💳 Pay & Execute`

### Step 5️⃣ - Processing

```
[14:30:01] Initiating X402 payment sequence...
[14:30:02] ✓ Permit signature received
[14:30:03] ✓ Payment intent signed
[14:30:04] ✓ Payment settled: 0.05 USDC transferred
[14:30:05] Processing PDF...
[14:30:08] ✓ Summary generated successfully
```

**Duration:** 3-8 seconds

### Step 6️⃣ - Result

- View your summarized content
- Copy text or download result
- Transaction link to Solana Explorer

---

# 🌐 Scenario 2: IoT Device Rental

## Goal
Rent and control a real device (robot) for a specified duration with USDC payment.

## Problem We Solve

| Traditional Solution | Issue |
|---------------------|-------|
| Buy the device | Expensive ($500+) |
| Monthly rental | Don't need it for a whole month |
| Travel to location | Impractical |

**SynapsePay Solution**: Pay $0.10 → Control for 10 minutes → Done

---

## Step-by-Step Guide

### Step 1️⃣ - Homepage

**Action:** Click `🌐 IoT Devices` in the sidebar

### Step 2️⃣ - IoT Device Hub

**URL:** `http://localhost:5173/devices`

**Available Devices:**

| Device | Type | Price | Duration | Status |
|--------|------|-------|----------|--------|
| 🤖 UGV Rover 01 | Robot | 0.10 USDC | 10 min | ✅ Available |
| 💡 Smart LED Array | LED | 0.05 USDC | 5 min | ✅ Available |
| 🚁 Drone Camera 01 | Drone | 0.25 USDC | 15 min | ⚠️ In Use |
| 🖨️ 3D Printer MK3 | Printer | 0.50 USDC | 30 min | 🔧 Maintenance |

**Action:** Click `Rent Now` on `UGV Rover 01`

### Step 3️⃣ - Connect Wallet

**URL:** `http://localhost:5173/devices/ugv-rover-01`

**Action:** Click `🔗 Connect Wallet`

### Step 4️⃣ - Payment Gate

**X402 Payment Steps:**

| Step | Description |
|------|-------------|
| 1️⃣ **Sign Permit** | Approve USDC spending (no gas fees) |
| 2️⃣ **Sign Intent** | Sign payment intent |
| 3️⃣ **Settlement** | Execute transaction on Solana |

**Action:** Click `⊕ Initialize Payment Sequence →`

### Step 5️⃣ - Processing (Automatic)

```
[12:45:01] Initiating X402 payment sequence...
[12:45:03] ✓ Permit signature received
[12:45:05] ✓ Payment intent signed
[12:45:07] ✓ Payment settled: 0.10 USDC transferred
[12:45:08] ✓ Access token issued
[12:45:09] Device access granted for 10 minutes
```

**Duration:** 5-6 seconds

### Step 6️⃣ - Control Interface

**Control Panel Features:**
- Live video feed
- Device status (battery, signal, temperature)
- Session timer countdown
- Directional controls

**Keyboard Controls:**

| Key | Keyboard | Function |
|-----|----------|----------|
| `↑` | `W` | Move forward |
| `↓` | `S` | Move backward |
| `←` | `A` | Turn left |
| `→` | `D` | Turn right |
| `●` | `Space` | Stop |

### Step 7️⃣ - Session End

When the timer reaches 00:00:
- Option to rent again
- Option to return to hub

---

# 🔄 Scenario 3: Subscriptions

## Goal
Schedule an automatic recurring task (like daily price reports) that executes and pays automatically.

## Problem We Solve

| Traditional Solution | Issue |
|---------------------|-------|
| Check manually daily | Boring and time-consuming |
| Monthly subscription service | $10/month is expensive |
| Build custom script | Too complex |

**SynapsePay Solution**: Schedule once → Runs automatically daily → Pays $0.01 per report

---

## Step-by-Step Guide

### Step 1️⃣ - Homepage

**Action:** Click `📊 Dashboard` in the sidebar

### Step 2️⃣ - Dashboard

**URL:** `http://localhost:5173/dashboard`

**Dashboard Overview:**
- Balance display
- Active subscriptions count
- Total spent

**Action:** Click `➕ Create New Subscription`

### Step 3️⃣ - Create Subscription

**Available Task Types:**
- 📈 Price Report
- 💾 Backup
- 🔔 Alerts
- 📊 Analytics

**Settings Example:**

| Setting | Value |
|---------|-------|
| **Task Type** | 📈 Price Report |
| **Frequency** | Daily |
| **Time** | 09:00 AM |
| **Tokens** | SOL, USDC, BTC |
| **Cost** | 0.01 USDC per run |

**Action:** 
1. Select task type
2. Set schedule
3. Click `✅ Create Subscription`

### Step 4️⃣ - Confirm Subscription

**Action:** Click `🔐 Authorize Auto-Payment` to approve automatic payments

### Step 5️⃣ - Automatic Execution

At the scheduled time, you'll receive:
- Automatic price report
- Auto-paid from your balance
- Next run scheduled

---

# 💳 X402 Payment Protocol

## How It Works

```
User clicks "Pay"
    ↓
[1] Sign Permit (USDC approval - NO GAS!)
    ↓
[2] Sign Payment Intent
    ↓
[3] Facilitator submits to Solana
    ↓
[4] Transaction confirmed (~400ms)
    ↓
[5] Task executed
    ↓
[6] Result returned with Explorer link
```

## Key Benefits

| Feature | Benefit |
|---------|---------|
| **Gasless** | Users don't pay transaction fees |
| **Instant** | ~400ms settlement on Solana |
| **Micropayments** | Pay as low as $0.01 |
| **Verifiable** | All transactions on Solana Explorer |

---

# 🔐 Wallet Setup

## Supported Wallets

| Wallet | Status |
|--------|--------|
| Phantom | ✅ Fully Supported |
| Solflare | ✅ Fully Supported |

## Setup Steps

1. Install Phantom or Solflare browser extension
2. Create or import a wallet
3. Switch to Devnet network
4. Get test SOL from [solfaucet.com](https://solfaucet.com)
5. Get test USDC (or use demo mode)

---

# 📊 Dashboard Features

## Overview Stats
- Current USDC balance
- Active subscriptions count
- Total USDC spent

## Recent Tasks
- Task history with status
- Transaction links
- Cost breakdown

## Subscription Management
- View active subscriptions
- Pause/Resume subscriptions
- Edit schedule
- Delete subscriptions

---

# ❓ FAQ

## General

**Q: Do I need SOL for gas fees?**
A: No! SynapsePay uses X402 protocol where the facilitator pays all gas fees. You only pay the service cost in USDC.

**Q: What's the minimum payment?**
A: You can pay as low as $0.01 USDC per task.

**Q: Is my payment secure?**
A: Yes! All payments use Ed25519 signatures and are verified on-chain before execution.

## Technical

**Q: What network is this on?**
A: Currently deployed on Solana Devnet. Mainnet deployment coming soon.

**Q: How fast are transactions?**
A: Solana provides ~400ms finality, so payments settle almost instantly.

**Q: Can I verify my transactions?**
A: Yes! Each transaction includes a link to Solana Explorer.

---

# 📞 Support

- **GitHub**: [github.com/samarabdelhameed/SynapsePay](https://github.com/samarabdelhameed/SynapsePay)
- **Solana Docs**: [docs.solana.com](https://docs.solana.com/)
- **Solana Explorer**: [explorer.solana.com](https://explorer.solana.com/?cluster=devnet)

---

*Built for Solana Winter Buildathon 2025*
