# 🚀 SynapsePay - Hackathon Submission

## Solana Winter Buildathon 2025

---

## 📋 Project Information

| Field | Value |
|-------|-------|
| **Project Name** | SynapsePay |
| **Tagline** | Pay-per-Action AI Agents on Solana |
| **Developer** | Samar Abdelhameed |
| **GitHub** | https://github.com/samarabdelhameed/SynapsePay |
| **Demo Video** | 🎬 **[ADD YOUR VIDEO LINK HERE]** |
| **Live Demo** | 🌐 **[ADD VERCEL URL HERE]** (Optional) |
| **Network** | Solana Devnet |

> ⚠️ **IMPORTANT**: Record your demo video using `DEMO_VIDEO_SCRIPT.md` and add the link above!

---

## 🎯 Challenge Tracks

### 1️⃣ Best Consumer App on Solana ($2,000)

**Why SynapsePay Qualifies:**

| Criteria | How We Meet It |
|----------|----------------|
| **Consumer-Facing** | ✅ Easy-to-use web app for running AI tasks |
| **Real Problem** | ✅ Eliminates wasteful subscription models |
| **Great UX** | ✅ Modern UI with Phantom/Solflare wallet integration |
| **Solana Native** | ✅ Instant payments, micropayments, Actions/Blinks |
| **Production Ready** | ✅ 3 deployed smart contracts, 4 running services |

**Target Users:**
- 👨‍💻 Freelancers who need occasional AI assistance
- 🧪 Developers testing AI capabilities before committing
- 🌐 IoT enthusiasts controlling devices remotely
- 💰 Anyone who doesn't want to pay for unused subscriptions

---

### 2️⃣ Best Use of x402 with Solana ($2,000)

**How We Implement X402:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    X402 Payment Flow                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User clicks "Pay & Run"                                        │
│         ↓                                                       │
│  [1] Create Invoice (POST /invoice)                             │
│         ↓                                                       │
│  [2] User signs payment intent (GASLESS - no SOL needed!)       │
│         ↓                                                       │
│  [3] X-PAYMENT header sent to Facilitator                       │
│         ↓                                                       │
│  [4] Facilitator verifies Ed25519 signature                     │
│         ↓                                                       │
│  [5] Facilitator submits USDC transfer to Solana                │
│         ↓                                                       │
│  [6] ~400ms: Transaction confirmed                              │
│         ↓                                                       │
│  [7] AI Agent executes task                                     │
│         ↓                                                       │
│  [8] Result returned with Solana Explorer link                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Key Technical Features:**

| Feature | Implementation |
|---------|---------------|
| **Gasless for Users** | ✅ Facilitator pays all transaction fees |
| **Ed25519 Signatures** | ✅ Standard Solana wallet signing |
| **On-Chain Settlement** | ✅ Real USDC-SPL transfers |
| **Verifiable Receipts** | ✅ Transaction links to Solana Explorer |
| **Micropayments** | ✅ As low as $0.01 USDC |
| **Instant Settlement** | ✅ ~400ms Solana finality |

---

## 💡 Problem Statement

### The Subscription Problem

```
┌─────────────────────────────────────────────────────────────────┐
│                    Current AI Pricing                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ChatGPT Plus:    $20/month → Often only use 5-10 queries      │
│  Midjourney:      $10/month → Maybe generate 20 images         │
│  Claude Pro:      $20/month → Occasional document analysis     │
│                                                                 │
│  Result: Users pay for features they rarely use                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Our Solution

```
┌─────────────────────────────────────────────────────────────────┐
│                    SynapsePay Pricing                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PDF Summary:     $0.05 per document                            │
│  Image Edit:      $0.10 per image                               │
│  NFT Mint:        $0.25 per NFT                                 │
│  Robot Control:   $0.10 per 10-min session                      │
│                                                                 │
│  Result: Pay ONLY for what you use                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technical Implementation

### Smart Contracts (Deployed on Solana Devnet)

| Contract | Program ID | Purpose |
|----------|-----------|---------|
| **Registry** | `5w8vTt1AUo67nE9bWA5e9Sh28HXtJJZaqiPj53n6wcby` | Agent registration & marketplace |
| **Payments** | `8yzR2Ze7t8NjH9b9wUUaUxkHLcrfogWqAzqbMSb1vZgP` | X402 payment processing & escrow |
| **Scheduler** | `8NWxX7CDYhpfWAG5Dd6UJQ4EU1Ykrid8CoJ48Kp8MjsY` | Subscriptions & automated tasks |

**Explorer Links:**
- [Registry Contract](https://explorer.solana.com/address/5w8vTt1AUo67nE9bWA5e9Sh28HXtJJZaqiPj53n6wcby?cluster=devnet)
- [Payments Contract](https://explorer.solana.com/address/8yzR2Ze7t8NjH9b9wUUaUxkHLcrfogWqAzqbMSb1vZgP?cluster=devnet)
- [Scheduler Contract](https://explorer.solana.com/address/8NWxX7CDYhpfWAG5Dd6UJQ4EU1Ykrid8CoJ48Kp8MjsY?cluster=devnet)

### Backend Services

| Service | Technology | Port | Status |
|---------|------------|------|--------|
| **Frontend** | React 18 + Vite | 5173 | ✅ Running |
| **X402 Facilitator** | Bun + Hono | 4021 | ✅ Running |
| **Resource Server** | Bun + Hono | 4020 | ✅ Running |
| **Actions API** | Bun + Hono | 8405 | ✅ Running |

### Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Smart Contracts** | Rust, Anchor Framework |
| **Backend** | Bun, TypeScript, Hono |
| **Frontend** | React 18, Vite, Framer Motion |
| **Styling** | Tailwind CSS, Custom Design System |
| **Wallet** | @solana/wallet-adapter-react |
| **Payments** | X402 Protocol, USDC-SPL |

---

## 📊 Available Agents

| Agent | Price | Description | Category |
|-------|-------|-------------|----------|
| 📄 PDF Summarizer | 0.05 USDC | AI-powered document analysis | AI |
| 🎨 Image Editor | 0.10 USDC | Background removal, filters | AI |
| 🖼️ NFT Minter | 0.25 USDC | Generate and mint NFT on Solana | NFT |
| 🐛 Code Debugger | 0.08 USDC | AI code analysis and fix | AI |
| 🤖 UGV Rover | 0.10 USDC | 10-min robot control session | IoT |
| 💡 Smart LED Array | 0.05 USDC | 5-min LED control session | IoT |

---

## 🎥 Demo Video Outline

| Time | Scene | Content |
|------|-------|---------|
| 0:00-0:15 | **Hook** | Problem statement - subscription waste |
| 0:15-0:40 | **Problem** | Show pricing comparisons |
| 0:40-1:50 | **Demo 1** | AI Agent payment with Phantom |
| 1:50-2:30 | **Demo 2** | IoT device rental |
| 2:30-3:10 | **Technical** | X402 flow explanation |
| 3:10-3:45 | **Closing** | Why Solana, deployed contracts |

**Total Duration: ~3.5 minutes**

---

## 🔗 Key Links

| Resource | URL |
|----------|-----|
| **GitHub Repository** | https://github.com/samarabdelhameed/SynapsePay |
| **Registry Contract** | [Solana Explorer](https://explorer.solana.com/address/5w8vTt1AUo67nE9bWA5e9Sh28HXtJJZaqiPj53n6wcby?cluster=devnet) |
| **Payments Contract** | [Solana Explorer](https://explorer.solana.com/address/8yzR2Ze7t8NjH9b9wUUaUxkHLcrfogWqAzqbMSb1vZgP?cluster=devnet) |
| **Scheduler Contract** | [Solana Explorer](https://explorer.solana.com/address/8NWxX7CDYhpfWAG5Dd6UJQ4EU1Ykrid8CoJ48Kp8MjsY?cluster=devnet) |

---

## 📝 Submission Checklist

### Required Items

| Item | Status | Notes |
|------|--------|-------|
| GitHub repository | ✅ Complete | Full source code |
| README with description | ✅ Complete | Comprehensive documentation |
| Deployed contracts on Devnet | ✅ Complete | 3 contracts live |
| Demo video (2-4 min) | ⏳ Pending | Script ready |
| Solana/X402 explanation | ✅ Complete | In README and docs |

### Recommended Items

| Item | Status | Notes |
|------|--------|-------|
| Clean, documented code | ✅ Complete | TypeScript, JSDoc |
| API documentation | ✅ Complete | In USER_GUIDE.md |
| User guide | ✅ Complete | Comprehensive guide |
| Architecture diagrams | ✅ Complete | Mermaid diagrams in README |
| Deployed frontend | 🔄 Optional | Works locally |

---

## 🏆 Why SynapsePay Should Win

### For "Best Consumer App on Solana"

| Strength | Details |
|----------|---------|
| **Solves Real Problem** | Subscription fatigue is universal |
| **Great UX** | One-click payments, beautiful UI |
| **Practical** | Could be used today for real AI tasks |
| **Innovative Model** | Pay-per-action is underexplored in Web3 |
| **Multiple Use Cases** | AI, NFT, IoT - broad appeal |

### For "Best Use of x402 with Solana"

| Strength | Details |
|----------|---------|
| **Complete Implementation** | Full invoice → settle → execute flow |
| **Gasless Experience** | Users never pay Solana transaction fees |
| **On-Chain Verification** | All payments verifiable on Explorer |
| **Real Use Case** | Not just a demo - functional product |
| **Technical Excellence** | 3 Anchor programs, clean architecture |

---

## 📈 Innovation Highlights

1. **Pay-Per-Action Model**: Revolutionary pricing for AI services
2. **X402 on Solana**: First implementation combining X402 with Solana's speed
3. **Gasless UX**: Users only pay for services, not blockchain fees
4. **Agent Marketplace**: Open platform for AI agent creators
5. **IoT Integration**: Bridge between blockchain and physical devices
6. **Solana Actions**: Payments from Twitter, QR codes, anywhere

---

## 🎯 One-Liner

> **"SynapsePay: Pay $0.05 per AI task instead of $20/month subscriptions - powered by X402 gasless micropayments on Solana"**

---

## 📞 Contact

- **Developer**: Samar Abdelhameed
- **GitHub**: [@samarabdelhameed](https://github.com/samarabdelhameed)
- **Project**: SynapsePay

---

*Built with ❤️ for Solana Winter Buildathon 2025*
