# 🎬 SynapsePay Demo Video Script

## 📋 Video Specifications

| Attribute | Value |
|-----------|-------|
| **Duration** | 3-4 minutes |
| **Resolution** | 1920x1080 (1080p) |
| **Format** | MP4/WebM |
| **Audio** | Clear voiceover + subtle background music |
| **Style** | Professional, modern, tech-focused |

---

## 🎯 Video Objective

Demonstrate SynapsePay's unique value proposition:
- **Pay-per-action AI** instead of subscriptions
- **X402 Protocol** for gasless micropayments
- **Solana** for instant settlement
- **Real working demo** with transaction proof

---

## 📝 Complete Script & Timeline

---

### 🎬 SCENE 1: Hook (0:00 - 0:15)

**[VISUAL: Dark screen with text animation]**

```
Text Animation:
"$20/month for AI you barely use?"
        ↓
"What if you paid just $0.05 per task?"
```

**VOICEOVER:**
> "What if you could pay AI agents by the task... not by subscription?"

**[VISUAL: SynapsePay logo appears with gradient animation]**

> "Introducing SynapsePay."

---

### 📊 SCENE 2: The Problem (0:15 - 0:40)

**[VISUAL: Show subscription pricing comparisons]**

```
Display animated cards:
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ ChatGPT Plus    │  │ Midjourney      │  │ Claude Pro      │
│ $20/month       │  │ $10/month       │  │ $20/month       │
│ ❌ Limited msgs │  │ ❌ Limited gen  │  │ ❌ Usage caps   │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

**VOICEOVER:**
> "Today, AI services charge monthly subscriptions."
> 
> "ChatGPT Plus: $20 a month. Midjourney: $10. Claude: $20."
> 
> "But most users only need a few tasks per month. That's money wasted."

**[VISUAL: Money going into trash animation]**

> "What if you only paid for what you actually use?"

**[VISUAL: Transition to SynapsePay solution]**

```
┌────────────────────────────────────────┐
│         SynapsePay Solution            │
│  ✅ $0.05 per task                     │
│  ✅ No subscriptions                   │
│  ✅ No gas fees                        │
│  ✅ Instant results                    │
└────────────────────────────────────────┘
```

---

### 🤖 SCENE 3: Demo - AI Agent Payment (0:40 - 1:50)

**[VISUAL: Screen recording of SynapsePay app]**

**VOICEOVER:**
> "Let me show you how SynapsePay works."

#### Step 1: Connect Wallet (0:40 - 0:55)

**[ACTION: Show the homepage]**

> "This is SynapsePay - a marketplace for pay-per-action AI agents."

**[ACTION: Click "Connect Wallet" button]**

> "First, I connect my Phantom wallet. I'm on Solana Devnet."

**[ACTION: Phantom modal opens, click connect]**

> "Connected! Notice my wallet address appears in the navbar."

---

#### Step 2: Browse Marketplace (0:55 - 1:10)

**[ACTION: Navigate to /marketplace]**

> "Let's explore the marketplace. We have AI agents, NFT tools, and even IoT devices."

**[ACTION: Hover over different agent cards]**

> "Each agent shows its exact price. PDF Summarizer: just 5 cents. Image Editor: 10 cents."

**[ACTION: Click on "PDF Summarizer"]**

> "I'll run the PDF Summarizer."

---

#### Step 3: Pay & Run (1:10 - 1:35)

**[ACTION: On agent details page, click "Pay & Run"]**

> "Click 'Pay & Run' to start."

**[VISUAL: Payment modal appears with X402 flow]**

> "The X402 payment flow begins. Step 1: Create an invoice."

**[VISUAL: First step completes with checkmark]**

> "Step 2: Sign the payment intent with my wallet."

**[ACTION: Phantom popup appears]**

> "Notice this is just a signature - I'm NOT paying any gas fees. That's the magic of X402."

**[ACTION: Sign the message in Phantom]**

**[VISUAL: Settlement step animates]**

> "Step 3: The X402 Facilitator submits my payment to Solana..."

**[VISUAL: Execution step animates]**

> "Step 4: The AI agent executes my task..."

---

#### Step 4: Success! (1:35 - 1:50)

**[VISUAL: Confetti animation, success checkmark]**

> "Done! In under 3 seconds, I paid 5 cents and got my result."

**[VISUAL: Show the transaction details card]**

```
Display:
Amount Paid: 0.05 USDC ✓
Network: Solana devnet
Transaction: 4xJ7k2...8mN9q
```

**[ACTION: Click "View on Solana Explorer"]**

**[VISUAL: Solana Explorer opens in new tab]**

> "And here's the proof - a real transaction on Solana. Fully verifiable, fully transparent."

**[ACTION: Zoom into transaction details on Explorer]**

> "You can see the USDC transfer from my wallet to the agent provider."

---

### 🌐 SCENE 4: Demo - IoT Device Control (1:50 - 2:30)

**[VISUAL: Navigate to /devices]**

**VOICEOVER:**
> "But SynapsePay isn't just for AI. You can also rent IoT devices with micropayments."

**[ACTION: Show device cards]**

> "Here we have connected devices - robots, LED arrays, sensors..."

**[ACTION: Click on "UGV Rover 01"]**

> "Let's rent this robot for 10 cents for a 10-minute session."

**[ACTION: Click "Rent Now", complete payment flow]**

> "Same X402 flow - sign, settle, execute."

**[VISUAL: Device control panel appears with live feed]**

> "And now I have full control - movement, rotation, even live camera feed."

**[ACTION: Move the control joystick/buttons]**

> "This is real-world value powered by blockchain micropayments."

---

### ⚡ SCENE 5: Technical Deep Dive (2:30 - 3:10)

**[VISUAL: Architecture diagram from README]**

**VOICEOVER:**
> "Under the hood, here's how it works."

```
Display animated flow:

User → Sign Intent → X402 Facilitator → Solana → AI Agent
        (Gasless)     (Submits TX)     (~400ms)   (Executes)
```

> "When you click 'Pay & Run', you sign a payment intent with your wallet. This is completely gasless for you."

**[VISUAL: Highlight X402 Facilitator]**

> "Our X402 Facilitator receives your signed intent, verifies it, and submits the USDC transfer to Solana."

> "We pay the gas - you only pay for the service."

**[VISUAL: Show terminal/logs from the payment flow]**

> "The entire settlement takes about 400 milliseconds, thanks to Solana's speed."

**[VISUAL: Show Solana Actions icon/Blinks]**

> "We also support Solana Actions - meaning you could trigger a payment from Twitter, email, or even a QR code."

---

### 🏆 SCENE 6: Deployed Contracts (3:10 - 3:25)

**[VISUAL: Show deployed contract addresses on Solana Explorer]**

**VOICEOVER:**
> "Everything is live on Solana Devnet."

**[VISUAL: Show table of contracts]**

```
┌──────────────────┬────────────────────────────────────────────┐
│ Contract         │ Program ID                                 │
├──────────────────┼────────────────────────────────────────────┤
│ Registry         │ 5w8vTt1AUo67nE9bWA5e9Sh28HXtJJZaqiPj53n... │
│ Payments         │ 8yzR2Ze7t8NjH9b9wUUaUxkHLcrfogWqAzqbMSb... │
│ Scheduler        │ 8NWxX7CDYhpfWAG5Dd6UJQ4EU1Ykrid8CoJ48Kp... │
└──────────────────┴────────────────────────────────────────────┘
```

> "Three smart contracts - Registry for agents, Payments for X402 processing, and Scheduler for automation."

> "All verified, all working."

---

### 🎉 SCENE 7: Closing (3:25 - 3:45)

**[VISUAL: Dashboard with statistics]**

**VOICEOVER:**
> "SynapsePay represents a new model for AI and automation:"

**[VISUAL: Animated text points]**

```
✅ Pay per action
✅ Instant settlement
✅ No subscriptions
✅ No gas fees
✅ Fully on-chain
```

> "Pay only for what you use. Settle instantly. No subscriptions. No gas fees for users."

**[VISUAL: "This is only possible on Solana" text animation]**

> "This is only possible on Solana."

**[VISUAL: GitHub repo and links appear]**

> "Check out our GitHub for the full source code."

**[VISUAL: Final logo animation with tagline]**

```
        ╔═══════════════════════════════════════╗
        ║                                       ║
        ║          🚀 SynapsePay                ║
        ║                                       ║
        ║   Pay-per-Action AI Agents on Solana  ║
        ║                                       ║
        ║   Built for Solana Winter Buildathon  ║
        ║              2025                     ║
        ║                                       ║
        ╚═══════════════════════════════════════╝
```

> "SynapsePay - Pay-per-Action AI on Solana. Built for Solana Winter Buildathon 2025."

> "Thank you for watching!"

---

## 🎥 Recording Checklist

### Before Recording

- [ ] **Screen Setup**
  - [ ] 1080p resolution
  - [ ] Dark mode enabled
  - [ ] Browser dev tools closed
  - [ ] No sensitive info visible
  - [ ] Clean desktop/browser tabs

- [ ] **Services Running**
  - [ ] Frontend on port 5173
  - [ ] X402 Facilitator on port 4021
  - [ ] Resource Server on port 4020
  - [ ] Actions API on port 8405

- [ ] **Wallet Ready**
  - [ ] Phantom installed
  - [ ] Set to Devnet
  - [ ] Has 0.5+ SOL for transactions
  - [ ] Has 1+ USDC for demo payments

- [ ] **Recording Software**
  - [ ] OBS Studio / Loom / ScreenFlow ready
  - [ ] Audio input tested
  - [ ] Background music selected

### During Recording

- [ ] Speak clearly and slowly
- [ ] Pause between sections
- [ ] Highlight clicks with cursor
- [ ] Wait for animations to complete
- [ ] Keep terminal visible during payment flow

### After Recording

- [ ] Export in 1080p MP4
- [ ] Add background music (10-15% volume)
- [ ] Add text overlays for key points
- [ ] Add transitions between scenes
- [ ] Upload to YouTube/Vimeo/Loom
- [ ] Update HACKATHON_SUBMISSION.md with link

---

## � Quick Start Commands

```bash
# Terminal 1: Start Frontend
cd /Users/s/Solana-SynapsePay/apps/web
npm run dev
# Access at http://localhost:5173

# Terminal 2: Start X402 Facilitator (Production Mode)
cd /Users/s/Solana-SynapsePay/apps/x402-facilitator
FACILITATOR_PRIVATE_KEY=<your-base58-key> FACILITATOR_PORT=4021 npm run dev

# Terminal 3: Start Resource Server
cd /Users/s/Solana-SynapsePay/apps/resource-server
RESOURCE_SERVER_PORT=4020 npm run dev

# Terminal 4: Start Actions API
cd /Users/s/Solana-SynapsePay/apps/actions-api
ACTIONS_API_PORT=8405 npm run dev
```

---

## 🔗 URLs to Show in Video

| Resource | URL |
|----------|-----|
| **Frontend** | http://localhost:5173 |
| **Registry Contract** | [Solana Explorer](https://explorer.solana.com/address/5w8vTt1AUo67nE9bWA5e9Sh28HXtJJZaqiPj53n6wcby?cluster=devnet) |
| **Payments Contract** | [Solana Explorer](https://explorer.solana.com/address/8yzR2Ze7t8NjH9b9wUUaUxkHLcrfogWqAzqbMSb1vZgP?cluster=devnet) |
| **Scheduler Contract** | [Solana Explorer](https://explorer.solana.com/address/8NWxX7CDYhpfWAG5Dd6UJQ4EU1Ykrid8CoJ48Kp8MjsY?cluster=devnet) |
| **GitHub** | https://github.com/samarabdelhameed/SynapsePay |

---

## 🎵 Recommended Background Music

- **Style**: Lo-fi beats, tech/electronic ambient
- **Volume**: 10-15% of voiceover volume
- **Sources** (Royalty-Free):
  - [Artlist](https://artlist.io)
  - [Epidemic Sound](https://epidemicsound.com)
  - [YouTube Audio Library](https://studio.youtube.com/channel/audio)

---

## 💡 Pro Tips for Recording

1. **Cursor Visibility**: Use a large, colorful cursor
2. **Zoom In**: Zoom on important UI elements (prices, buttons)
3. **Transitions**: Use smooth fades between sections
4. **Highlights**: Circle or box important features with screen annotations
5. **Pacing**: Not too fast - give viewers time to absorb information
6. **Audio**: Record voiceover separately for better quality
7. **B-Roll**: Insert architecture diagrams during technical sections

---

## 📊 Key Stats to Mention

- **Payment Time**: ~400ms settlement (Solana speed)
- **Fee for Users**: $0 gas (X402 gasless)
- **Min Payment**: $0.01 USDC micropayments
- **Contracts Deployed**: 3 on Devnet
- **Services Running**: 4 backend services
- **Wallet Support**: Phantom, Solflare

---

*Last Updated: December 13, 2025*
*Built with ❤️ for Solana Winter Buildathon 2025*
