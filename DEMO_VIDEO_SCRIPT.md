# 🎬 SynapsePay Demo Video Script
## Professional Technical Demonstration Guide

---

# 📋 Video Overview

| Attribute | Details |
|-----------|---------|
| **Duration** | 3-4 minutes |
| **Format** | Screen recording + Voice-over |
| **Target** | Hackathon Judges (Technical) |
| **Focus** | X402 + Solana Integration |
| **Tracks** | Best Consumer App + Best Use of X402 |

---

# 🎯 Key Points to Demonstrate

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     DEMO FOCUS AREAS                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ✅ X402 Protocol Integration                                           │
│     → Gasless micropayments on Solana                                   │
│     → Permit + Intent signature flow                                    │
│     → On-chain USDC settlement                                          │
│                                                                          │
│  ✅ Full-Stack Integration                                              │
│     → React Frontend with Wallet Adapter                                │
│     → X402 Facilitator Backend                                          │
│     → Anchor Smart Contracts                                            │
│                                                                          │
│  ✅ Real-World Use Cases                                                │
│     → AI Agent Micropayments                                            │
│     → IoT Device Rental                                                 │
│     → Subscription Scheduling                                           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

# 🎬 SCENE 1: Introduction (0:00 - 0:30)

## 🎤 Voice Script

> "Welcome to SynapsePay - the first platform bringing X402 micropayments to Solana.
> 
> Today, I'll show you how we've built a complete payment infrastructure that enables:
> - **Zero-gas micropayments** for AI agents
> - **Real-time IoT device rentals**
> - **Automated subscription payments**
> 
> All powered by X402 protocol and Anchor smart contracts on Solana devnet."

## 📺 Screen Actions

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SCREEN RECORDING:                                                       │
│                                                                          │
│  1. Show the landing page: https://synapsepay-demo.surge.sh             │
│  2. Scroll through hero section                                          │
│  3. Highlight "Powered by X402" badge                                    │
│  4. Show Solana network indicator                                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## 🔧 Technical Integration Points

| Layer | Technology | What to Show |
|-------|------------|--------------|
| **Frontend** | React + Vite | Landing page, responsive UI |
| **Wallet** | Solana Wallet Adapter | Connect button ready |
| **Network** | Solana Devnet | Network badge visible |

---

# 🎬 SCENE 2: Architecture Overview (0:30 - 1:00)

## 🎤 Voice Script

> "Let me quickly walk you through our architecture.
> 
> SynapsePay consists of **three layers**:
> 
> **Layer 1** - The React frontend with Phantom wallet integration.
> 
> **Layer 2** - The X402 Facilitator server that handles payment verification and settlement.
> 
> **Layer 3** - Three Anchor smart contracts deployed on Solana devnet:
> - **Registry Program** - Manages AI agent registration
> - **Payments Program** - Handles invoice creation and USDC settlement
> - **Scheduler Program** - Manages recurring subscriptions
> 
> All three programs are verified and live on devnet."

## 📺 Screen Actions

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SCREEN RECORDING:                                                       │
│                                                                          │
│  Option A: Show Architecture Diagram (if you have one)                   │
│  Option B: Show Solana Explorer with deployed contracts                  │
│                                                                          │
│  Show these Program IDs on Solana Explorer:                              │
│  • Registry:  5w8vTt1AUo67nE9bWA5e9Sh28HXtJJZaqiPj53n6wcby              │
│  • Payments:  8yzR2Ze7t8NjH9b9wUUaUxkHLcrfogWqAzqbMSb1vZgP              │
│  • Scheduler: 8NWxX7CDYhpfWAG5Dd6UJQ4EU1Ykrid8CoJ48Kp8MjsY              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## 🔧 Technical Integration Points

| Component | Role | Explorer Link |
|-----------|------|---------------|
| **Registry** | Agent catalog | https://explorer.solana.com/address/5w8vTt1AUo67nE9bWA5e9Sh28HXtJJZaqiPj53n6wcby?cluster=devnet |
| **Payments** | X402 settlement | https://explorer.solana.com/address/8yzR2Ze7t8NjH9b9wUUaUxkHLcrfogWqAzqbMSb1vZgP?cluster=devnet |
| **Scheduler** | Subscriptions | https://explorer.solana.com/address/8NWxX7CDYhpfWAG5Dd6UJQ4EU1Ykrid8CoJ48Kp8MjsY?cluster=devnet |

---

# 🎬 SCENE 3: Connect Wallet (1:00 - 1:15)

## 🎤 Voice Script

> "Let's start by connecting a Phantom wallet on devnet.
> 
> The frontend uses **Solana Wallet Adapter** which provides a unified interface for all Solana wallets.
> 
> Notice how the UI immediately shows our USDC balance once connected."

## 📺 Screen Actions

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SCREEN RECORDING:                                                       │
│                                                                          │
│  1. Click "Connect Wallet" button                                        │
│  2. Select "Phantom"                                                     │
│  3. Approve connection in Phantom popup                                  │
│  4. Show wallet address appears in navbar                                │
│  5. Show USDC balance (e.g., "12.50 USDC")                              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## 🔧 Technical Integration Points

```typescript
// Frontend: apps/web/src/contexts/WalletProvider.tsx
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';

const network = WalletAdapterNetwork.Devnet;
const endpoint = 'https://api.devnet.solana.com';
```

| Integration | Code Location | Purpose |
|-------------|---------------|---------|
| Wallet Adapter | `apps/web/src/contexts/` | Multi-wallet support |
| USDC Balance | `packages/x402-solana/` | SPL Token balance check |
| Network Config | `.env` | Devnet RPC endpoint |

---

# 🎬 SCENE 4: AI Agent Marketplace (1:15 - 1:30)

## 🎤 Voice Script

> "Now let's explore the **Agent Marketplace**.
> 
> Each agent here is registered on-chain using our **Registry smart contract**.
> 
> The metadata - name, description, price - is stored on IPFS with the CID recorded on-chain.
> 
> I'll select the **PDF Summarizer** agent which costs just **0.05 USDC** per task."

## 📺 Screen Actions

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SCREEN RECORDING:                                                       │
│                                                                          │
│  1. Navigate to Marketplace (/marketplace)                               │
│  2. Show grid of available agents                                        │
│  3. Hover over "PDF Summarizer" card (show animation)                   │
│  4. Point out the price: "0.05 USDC"                                    │
│  5. Click "View Details"                                                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## 🔧 Technical Integration Points

```rust
// Smart Contract: programs/synapsepay-registry/src/state/agent.rs
pub struct Agent {
    pub agent_id: String,        // Unique identifier
    pub metadata_cid: String,    // IPFS CID for metadata
    pub price: u64,              // Price in USDC (6 decimals)
    pub owner: Pubkey,           // Agent owner
    pub is_active: bool,
    pub total_runs: u64,
    pub total_earned: u64,
}
```

| Integration | Layer | Description |
|-------------|-------|-------------|
| Agent Registration | Smart Contract | On-chain catalog |
| Metadata Storage | IPFS | Decentralized metadata |
| Price Display | Frontend | Format USDC (÷ 1,000,000) |

---

# 🎬 SCENE 5: X402 Payment Flow - THE KEY DEMO (1:30 - 2:30)

## 🎤 Voice Script

> "This is the **core innovation** - the X402 payment flow.
> 
> Watch what happens when I click **Run Agent**:
> 
> **Step 1**: The frontend sends a request to our **X402 Facilitator** to create an invoice.
> 
> **Step 2**: The Facilitator calls the **Payments smart contract** to create an on-chain invoice with escrow.
> 
> **Step 3**: I sign a **Permit** message - this is an off-chain signature that authorizes USDC spending, **completely gasless** for me.
> 
> **Step 4**: I sign the **Payment Intent** - another off-chain signature confirming the payment.
> 
> **Step 5**: The Facilitator submits the transaction to Solana, settling the payment on-chain.
> 
> Notice - I only signed **two messages**. Zero gas fees for the user. The USDC is now transferred and the task executes automatically."

## 📺 Screen Actions

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SCREEN RECORDING (CRITICAL SCENE):                                     │
│                                                                          │
│  1. On Agent Detail page, click "🚀 Run Agent (0.05 USDC)"              │
│  2. Show Payment Modal appears                                           │
│  3. Watch terminal log showing:                                          │
│     [INFO] Initiating X402 payment sequence...                          │
│     [INFO] Creating invoice on Payments Program...                      │
│     [INFO] Requesting USDC-SPL permit signature...                      │
│  4. Phantom popup appears - "Sign Message" (NOT Transaction!)           │
│  5. Sign the permit                                                      │
│  6. Second Phantom popup - "Sign Payment Intent"                        │
│  7. Sign the intent                                                      │
│  8. Watch log:                                                           │
│     [INFO] Submitting to Solana network...                              │
│     [INFO] ✓ Payment settled: 0.05 USDC transferred                     │
│     [INFO] TX Signature: 3xK9m...                                       │
│  9. Success animation with confetti 🎉                                   │
│                                                                          │
│  ⚠️ IMPORTANT: Pause and highlight that user signs MESSAGES not TXs     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## 🔧 Technical Integration Points - DETAILED

### Frontend → Facilitator

```typescript
// packages/x402-solana/src/client.ts
async createInvoice(params: InvoiceParams): Promise<Invoice> {
  const response = await fetch(`${this.facilitatorUrl}/api/invoice`, {
    method: 'POST',
    body: JSON.stringify({
      agentId: params.agentId,
      amount: params.amount,
      payer: params.payer.toBase58(),
      recipient: params.recipient.toBase58(),
    })
  });
  return response.json();
}
```

### Facilitator → Smart Contract

```rust
// programs/synapsepay-payments/src/instructions/create_invoice.rs
pub fn create_invoice(
    ctx: Context<CreateInvoice>,
    payment_id: String,
    amount: u64,
    nonce: u64,
    expires_at: i64,
) -> Result<()> {
    let invoice = &mut ctx.accounts.invoice;
    invoice.payment_id = payment_id;
    invoice.payer = ctx.accounts.payer.key();
    invoice.recipient = ctx.accounts.recipient.key();
    invoice.amount = amount;
    invoice.status = InvoiceStatus::Pending;
    
    // Transfer USDC to escrow
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.payer_token.to_account_info(),
                to: ctx.accounts.escrow.to_account_info(),
                authority: ctx.accounts.payer.to_account_info(),
            },
        ),
        amount,
    )?;
    
    Ok(())
}
```

### X402 Signature Flow

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        X402 SIGNATURE FLOW                                  │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  USER WALLET                    FACILITATOR                   SOLANA       │
│       │                              │                          │          │
│       │  1. Request Invoice          │                          │          │
│       │─────────────────────────────>│                          │          │
│       │                              │  2. createInvoice()      │          │
│       │                              │─────────────────────────>│          │
│       │  3. Invoice Created          │                          │          │
│       │<─────────────────────────────│                          │          │
│       │                              │                          │          │
│       │  4. Sign Permit Message      │                          │          │
│       │  ┌──────────────────────┐    │                          │          │
│       │  │ "Permit 0.05 USDC"  │    │                          │          │
│       │  │ To: Agent Address   │    │                          │          │
│       │  │ Nonce: 12345        │    │                          │          │
│       │  └──────────────────────┘    │                          │          │
│       │                              │                          │          │
│       │  5. Sign Intent Message      │                          │          │
│       │  ┌──────────────────────┐    │                          │          │
│       │  │ "Pay 0.05 USDC"     │    │                          │          │
│       │  │ Invoice: inv_abc    │    │                          │          │
│       │  └──────────────────────┘    │                          │          │
│       │                              │                          │          │
│       │  6. Send Signatures          │                          │          │
│       │─────────────────────────────>│                          │          │
│       │                              │  7. settlePayment()      │          │
│       │                              │─────────────────────────>│          │
│       │                              │  8. Transfer USDC ✓      │          │
│       │                              │<─────────────────────────│          │
│       │  9. TX Confirmed ✓           │                          │          │
│       │<─────────────────────────────│                          │          │
│       │                              │                          │          │
│  ✅ USER PAID 0 GAS FEES!           │                          │          │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

| Step | Component | Code Location | Description |
|------|-----------|---------------|-------------|
| 1-2 | Invoice Creation | `apps/x402-facilitator/src/routes/invoice.ts` | Create on-chain invoice |
| 3 | Invoice Return | `packages/x402-solana/src/types.ts` | Invoice structure |
| 4 | Permit Signing | `packages/x402-solana/src/permit.ts` | EIP-2612 style permit |
| 5 | Intent Signing | `packages/x402-solana/src/intent.ts` | Payment intent |
| 6-7 | Settlement | `programs/synapsepay-payments/src/instructions/settle_payment.rs` | On-chain USDC transfer |

---

# 🎬 SCENE 6: Task Execution & Result (2:30 - 2:45)

## 🎤 Voice Script

> "With payment confirmed on-chain, the **Resource Server** automatically receives the task.
> 
> It verifies the X402 payment header, processes the PDF, and returns the summary.
> 
> The entire flow - from click to result - took about **5 seconds**.
> 
> And look - we can click on the transaction signature to see the actual on-chain proof of payment on Solana Explorer."

## 📺 Screen Actions

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SCREEN RECORDING:                                                       │
│                                                                          │
│  1. Show task processing animation                                       │
│  2. Result appears with summary text                                     │
│  3. Highlight transaction signature link                                 │
│  4. Click to open Solana Explorer                                        │
│  5. Show the actual USDC transfer transaction on Explorer                │
│  6. Point out: "0.05 USDC transferred from User to Agent Owner"         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## 🔧 Technical Integration Points

```typescript
// apps/resource-server/src/middleware/x402.ts
async function verifyX402Payment(req: Request): Promise<boolean> {
  const paymentHeader = req.headers['x-payment'];
  
  // Decode and verify payment payload
  const payload = decodePaymentPayload(paymentHeader);
  
  // Verify against Payments Program
  const invoice = await program.account.invoice.fetch(payload.invoiceAddress);
  
  return invoice.status === 'completed';
}
```

| Integration | Layer | Purpose |
|-------------|-------|---------|
| X-PAYMENT Header | HTTP | Payment proof |
| Invoice Verification | Smart Contract | On-chain validation |
| Task Processing | Resource Server | AI execution |

---

# 🎬 SCENE 7: IoT Device Demo (2:45 - 3:15)

## 🎤 Voice Script

> "SynapsePay isn't just for AI - it works for any pay-per-use scenario.
> 
> Here's our **IoT Device Hub** where you can rent real devices by the minute.
> 
> Watch as I rent this virtual robot for **10 minutes at 0.10 USDC**.
> 
> Same X402 flow - permit signature, intent signature, instant access.
> 
> Now I have real-time controls. Every command I send is a micropayment - **streaming payments on Solana**."

## 📺 Screen Actions

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SCREEN RECORDING:                                                       │
│                                                                          │
│  1. Navigate to IoT Devices (/devices)                                   │
│  2. Click "Rent Now" on "UGV Rover 01"                                  │
│  3. Complete X402 payment (0.10 USDC)                                   │
│  4. Show Device Control Interface appears                                │
│  5. Use WASD to control the robot                                       │
│  6. Show real-time feedback (battery, signal, position)                 │
│  7. Show countdown timer (10:00 → 09:59)                                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## 🔧 Technical Integration Points

```rust
// Device session is managed on-chain
pub struct DeviceSession {
    pub device_id: String,
    pub user: Pubkey,
    pub started_at: i64,
    pub expires_at: i64,
    pub amount_paid: u64,
}
```

---

# 🎬 SCENE 8: Subscriptions & Scheduler (3:15 - 3:30)

## 🎤 Voice Script

> "Finally, our **Scheduler Program** enables recurring payments.
> 
> I can create a subscription that runs daily, weekly, or on custom schedules.
> 
> The smart contract holds my authorized payment amount in escrow and automatically triggers tasks on schedule.
> 
> This is **true account abstraction** - set it once, and it runs forever without manual intervention."

## 📺 Screen Actions

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SCREEN RECORDING:                                                       │
│                                                                          │
│  1. Navigate to Dashboard                                                │
│  2. Show existing subscriptions                                          │
│  3. Click "Create New Subscription"                                      │
│  4. Select "Daily Price Report"                                          │
│  5. Set time to 9:00 AM                                                  │
│  6. Show cost: "0.01 USDC per execution"                                │
│  7. Create and authorize                                                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## 🔧 Technical Integration Points

```rust
// programs/synapsepay-scheduler/src/state/subscription.rs
pub struct Subscription {
    pub id: String,
    pub owner: Pubkey,
    pub agent_id: String,
    pub amount_per_run: u64,
    pub cadence: ScheduleCadence,
    pub next_run_at: i64,
    pub total_runs: u64,
    pub is_active: bool,
}

pub enum ScheduleCadence {
    Hourly,
    Daily,
    Weekly,
    Monthly,
    Custom { seconds: u64 },
}
```

---

# 🎬 SCENE 9: Conclusion (3:30 - 4:00)

## 🎤 Voice Script

> "To summarize, SynapsePay brings the **X402 protocol to Solana**, enabling:
> 
> ✅ **Gasless micropayments** - Users sign messages, not transactions
> 
> ✅ **On-chain settlement** - Real USDC transfers verified on Solana
> 
> ✅ **Multiple use cases** - AI agents, IoT devices, subscriptions
> 
> ✅ **Full-stack integration** - React frontend, Node.js backend, Anchor smart contracts
> 
> All code is open source, all contracts are verified on devnet.
> 
> Thank you for watching! Check out our links below."

## 📺 Screen Actions

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SCREEN RECORDING:                                                       │
│                                                                          │
│  1. Show summary slide or return to homepage                             │
│  2. Display:                                                             │
│     • GitHub: github.com/SamarAbdelhameed/SynapsePay                    │
│     • Demo: synapsepay-demo.surge.sh                                    │
│     • Devnet Programs: [List Program IDs]                               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

# 📝 Pre-Recording Checklist

## Environment Setup

```bash
# 1. Ensure devnet wallet has funds
solana balance --url devnet
# Should show: > 1 SOL

# 2. Check USDC balance
spl-token balance 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU --url devnet
# Should show: > 1 USDC

# 3. Start all services
cd /Users/s/Solana-SynapsePay

# Terminal 1: Frontend
cd apps/web && npm run dev

# Terminal 2: Facilitator (optional for demo mode)
cd apps/x402-facilitator && npm run dev

# Terminal 3: Resource Server (optional)
cd apps/resource-server && npm run dev
```

## Browser Setup

- [ ] Phantom wallet installed
- [ ] Switched to Devnet network
- [ ] Wallet has SOL (for any gas needs)
- [ ] Wallet has USDC (12+ USDC recommended)
- [ ] Browser zoomed to 110% for visibility
- [ ] Clear browser cache
- [ ] Close unnecessary tabs

## Recording Setup

- [ ] Screen resolution: 1920x1080
- [ ] Hide bookmarks bar
- [ ] Clean desktop
- [ ] Disable notifications
- [ ] Test microphone levels
- [ ] Quiet environment

---

# 🎯 Key Phrases to Say

These phrases emphasize the hackathon requirements:

| When | Say This |
|------|----------|
| Payment flow | "Notice I'm signing a **message**, not a transaction - **zero gas fees** for the user" |
| Settlement | "The USDC transfer is happening **on-chain on Solana** right now" |
| Explorer | "Here's the **proof on Solana Explorer** - real USDC, real transaction" |
| X402 | "This is the **X402 protocol** - gasless micropayments made possible" |
| Smart Contracts | "Our **Anchor programs are deployed and verified** on devnet" |
| Consumer App | "Any user can pay 5 cents to run an AI agent - that's the **consumer use case**" |

---

# 🔗 Links to Show on Screen

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         IMPORTANT LINKS                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  🌐 Live Demo                                                            │
│  https://synapsepay-demo.surge.sh                                       │
│                                                                          │
│  📦 GitHub Repository                                                    │
│  https://github.com/SamarAbdelhameed/SynapsePay                         │
│                                                                          │
│  ⛓️ Smart Contracts (Devnet)                                            │
│  Registry:  5w8vTt1AUo67nE9bWA5e9Sh28HXtJJZaqiPj53n6wcby               │
│  Payments:  8yzR2Ze7t8NjH9b9wUUaUxkHLcrfogWqAzqbMSb1vZgP               │
│  Scheduler: 8NWxX7CDYhpfWAG5Dd6UJQ4EU1Ykrid8CoJ48Kp8MjsY               │
│                                                                          │
│  📚 Documentation                                                        │
│  See USER_GUIDE.md and README.md in repository                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

# ⏱️ Timing Summary

| Scene | Duration | Cumulative |
|-------|----------|------------|
| 1. Introduction | 0:30 | 0:30 |
| 2. Architecture | 0:30 | 1:00 |
| 3. Connect Wallet | 0:15 | 1:15 |
| 4. Marketplace | 0:15 | 1:30 |
| 5. **X402 Payment** | 1:00 | 2:30 |
| 6. Task Result | 0:15 | 2:45 |
| 7. IoT Demo | 0:30 | 3:15 |
| 8. Subscriptions | 0:15 | 3:30 |
| 9. Conclusion | 0:30 | **4:00** |

---

# 🎬 Recording Tips

1. **Keep it concise** - Judges watch many videos, respect their time
2. **Show, don't tell** - Let the UI speak for itself
3. **Highlight signatures** - The gasless UX is your key differentiator
4. **Show Explorer** - On-chain proof is critical
5. **Smooth transitions** - Practice the flow before recording
6. **Clear audio** - Technical terms must be audible

---

**Good luck with your recording! 🚀**

*Last updated: December 14, 2024*
