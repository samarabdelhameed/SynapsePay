# SynapsePay Smart Contracts - Complete Documentation

## 🎯 Overview

SynapsePay consists of **3 Anchor programs** that work together to create a decentralized payment infrastructure for AI agents, IoT devices, and subscription services on Solana.

---

## 📦 Programs

### 1. **SynapsePay Registry** (`synapsepay-registry`)
**Program ID**: `SYNRegistry111111111111111111111111111111111`

**Purpose**: Manages the marketplace of AI agents and their metadata.

#### Instructions:

| Instruction | Description | Parameters |
|------------|-------------|------------|
| `register_agent` | Register a new AI agent | `agent_id`, `metadata_cid`, `price`, `category` |
| `update_agent` | Update agent metadata/price | `new_metadata_cid`, `new_price` |
| `deactivate_agent` | Remove agent from marketplace | - |
| `reactivate_agent` | Reactivate deactivated agent | - |
| `transfer_ownership` | Transfer agent to new owner | `new_owner` |

#### State Accounts:

**Agent Account**:
```rust
pub struct Agent {
    pub owner: Pubkey,           // Agent owner wallet
    pub agent_id: String,        // Unique identifier (max 32 chars)
    pub metadata_cid: String,    // IPFS CID (max 64 chars)
    pub price: u64,              // Price in USDC (6 decimals)
    pub category: AgentCategory, // AI, IoT, Automation, etc.
    pub total_runs: u64,         // Total executions
    pub total_earned: u64,       // Total USDC earned
    pub rating: u16,             // 0-500 (0.0-5.0 stars)
    pub rating_count: u32,       // Number of ratings
    pub is_active: bool,         // Active status
    pub created_at: i64,         // Creation timestamp
    pub updated_at: i64,         // Last update timestamp
    pub bump: u8,                // PDA bump
}
```

---

### 2. **SynapsePay Payments** (`synapsepay-payments`)
**Program ID**: `SYNPayments111111111111111111111111111111111`

**Purpose**: Handles payment flow, escrow, receipts, and fee management.

#### Instructions:

| Instruction | Description | Accounts Required |
|------------|-------------|-------------------|
| `initialize_platform` | Initialize fee treasury & authorities | Admin, USDC mint |
| `create_invoice` | Create payment invoice | Payer, recipient, agent_id |
| `settle_payment` | Settle payment with signature | Payer, invoice |
| `verify_payment` | Verify & escrow USDC | Payer, payment, token accounts |
| `complete_task` | Mark task complete with result | Authority, payment, result_cid |
| `mint_receipt` | Mint on-chain receipt NFT | Payer, payment, invoice |
| `claim_payment` | Agent claims payment | Recipient, payment, escrow |
| `refund_payment` | Refund failed payment | Authority, payment, escrow |
| `withdraw_fees` | Admin withdraws platform fees | Admin, fee treasury |

#### State Accounts:

**Invoice Account**:
```rust
pub struct Invoice {
    pub invoice_id: Pubkey,
    pub payer: Pubkey,
    pub recipient: Pubkey,
    pub agent_id: String,
    pub amount: u64,
    pub state: PaymentState,
    pub expires_at: i64,
    pub created_at: i64,
    pub nonce: u64,
    pub bump: u8,
}
```

**Payment Account**:
```rust
pub struct Payment {
    pub payment_id: Pubkey,
    pub invoice: Pubkey,
    pub payer: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,              // Net amount (95%)
    pub platform_fee: u64,        // Platform fee (5%)
    pub state: PaymentState,
    pub result_cid: String,       // IPFS result
    pub tx_signature: [u8; 64],
    pub settled_at: i64,
    pub bump: u8,
}
```

**Receipt Account**:
```rust
pub struct Receipt {
    pub receipt_id: Pubkey,
    pub payment: Pubkey,
    pub payer: Pubkey,
    pub agent_id: String,
    pub amount: u64,
    pub result_cid: String,
    pub minted_at: i64,
    pub slot: u64,
    pub bump: u8,
}
```

#### Payment States:
```rust
pub enum PaymentState {
    InvoiceCreated,  // Invoice created
    Pending,         // Payment settled, awaiting verification
    Executing,       // Payment verified, agent executing
    Completed,       // Task completed
    ReceiptMinted,   // Receipt minted
    Claimed,         // Payment claimed by agent
    Expired,         // Invoice expired
    Failed,          // Payment failed
    Refunded,        // Payment refunded
}
```

#### PDAs (Program Derived Addresses):

| PDA | Seeds | Purpose |
|-----|-------|---------|
| `platform_authority` | `["platform_authority"]` | Signs platform operations |
| `escrow_authority` | `["escrow_authority"]` | Signs escrow transfers |
| `fee_treasury` | `["fee_treasury"]` | Holds platform fees (5%) |
| `escrow` | `["escrow", payment_pubkey]` | Holds payment in escrow |
| `invoice` | `["invoice", payer, agent_id, timestamp]` | Invoice account |
| `payment` | `["payment", invoice_pubkey]` | Payment account |
| `receipt` | `["receipt", payment_pubkey]` | Receipt account |

---

### 3. **SynapsePay Scheduler** (`synapsepay-scheduler`)
**Program ID**: `SYNScheduler11111111111111111111111111111111`

**Purpose**: Manages recurring subscriptions and automated task scheduling.

#### Instructions:

| Instruction | Description | Parameters |
|------------|-------------|------------|
| `initialize_scheduler` | Initialize vault authority | Admin |
| `create_subscription` | Create new subscription | `agent_id`, `cadence`, `max_runs` |
| `update_subscription` | Update subscription cadence | `new_cadence` |
| `pause_subscription` | Pause active subscription | - |
| `resume_subscription` | Resume paused subscription | - |
| `cancel_subscription` | Cancel & refund subscription | - |
| `trigger_scheduled_task` | Execute scheduled task (keeper) | - |
| `fund_subscription` | Add USDC to subscription | `amount` |

#### State Accounts:

**Subscription Account**:
```rust
pub struct Subscription {
    pub subscription_id: Pubkey,
    pub owner: Pubkey,
    pub agent_id: String,
    pub cadence: ScheduleCadence,
    pub next_run_at: i64,
    pub last_run_at: i64,
    pub total_runs: u64,
    pub max_runs: u64,           // 0 = unlimited
    pub balance: u64,            // Pre-funded USDC balance
    pub is_active: bool,
    pub is_paused: bool,
    pub created_at: i64,
    pub bump: u8,
}
```

#### Schedule Cadence:
```rust
pub enum ScheduleCadence {
    Hourly,              // Every hour
    Daily,               // Every 24 hours
    Weekly,              // Every 7 days
    Monthly,             // Every 30 days
    Custom { seconds },  // Custom interval
}
```

#### PDAs:

| PDA | Seeds | Purpose |
|-----|-------|---------|
| `subscription_vault_authority` | `["subscription_vault_authority"]` | Signs vault operations |
| `subscription_vault` | `["subscription_vault", subscription_pubkey]` | Holds subscription USDC |
| `subscription` | `["subscription", owner, agent_id]` | Subscription account |

#### Events:

**ScheduledTaskTriggered**:
```rust
pub struct ScheduledTaskTriggered {
    pub subscription_id: Pubkey,
    pub agent_id: String,
    pub run_number: u64,
    pub timestamp: i64,
    pub amount_paid: u64,
}
```

---

## 🔄 Payment Flow

### One-Time Payment Flow:

1. **Create Invoice**: User creates invoice for agent execution
2. **Settle Payment**: User signs payment with wallet
3. **Verify Payment**: System verifies signature & escrows USDC (95% to escrow, 5% to fee treasury)
4. **Execute Task**: Agent executes task off-chain
5. **Complete Task**: System stores result CID on-chain
6. **Mint Receipt**: User mints on-chain receipt NFT
7. **Claim Payment**: Agent owner claims payment from escrow

### Subscription Flow:

1. **Create Subscription**: User creates subscription with cadence
2. **Fund Subscription**: User pre-funds subscription vault with USDC
3. **Trigger Task**: Keeper/crank triggers task when `next_run_at` is reached
4. **Deduct Payment**: System deducts agent price + fee from subscription balance
5. **Execute Task**: Agent executes task off-chain
6. **Repeat**: Process repeats until balance depleted or max_runs reached

---

## 💰 Fee Structure

- **Platform Fee**: 5% of agent price
- **Agent Payment**: 95% of agent price
- **Fee Distribution**: Fees accumulate in `fee_treasury` PDA
- **Fee Withdrawal**: Admin can withdraw fees via `withdraw_fees` instruction

---

## 🔒 Security Features

1. **PDA Authorities**: All critical operations use PDA signers
2. **Escrow System**: Payments held in escrow until task completion
3. **Signature Verification**: Ed25519 signature verification for payments
4. **Nonce Protection**: Replay attack prevention with nonces
5. **State Validation**: Strict state machine for payment flow
6. **Owner Checks**: All mutations require proper ownership verification

---

## 🛠️ Development

### Build:
```bash
anchor build
```

### Test:
```bash
anchor test
```

### Deploy:
```bash
anchor deploy --provider.cluster devnet
```

---

## 📝 Error Codes

### Payment Errors:
- `InvalidAmount`: Amount must be > 0
- `InvalidExpiry`: Expiry must be in future
- `InvoiceExpired`: Invoice has expired
- `InvalidState`: Invalid payment state transition
- `Unauthorized`: Caller not authorized
- `InvalidSignature`: Invalid payment signature

### Scheduler Errors:
- `AgentIdTooLong`: Agent ID exceeds max length
- `NotActive`: Subscription not active
- `IsPaused`: Subscription is paused
- `InsufficientBalance`: Insufficient subscription balance
- `NotTimeYet`: Not time to run scheduled task
- `MaxRunsReached`: Maximum runs reached

---

## 🎓 Usage Examples

### Register Agent:
```typescript
await program.methods
  .registerAgent("my-agent-id", "QmXXX...", 1_000_000, { ai: {} })
  .accounts({ owner, agent })
  .rpc();
```

### Create Payment:
```typescript
await program.methods
  .createInvoice("my-agent-id", 1_000_000, expiryTimestamp)
  .accounts({ payer, recipient, invoice })
  .rpc();
```

### Create Subscription:
```typescript
await program.methods
  .createSubscription("my-agent-id", { daily: {} }, 30)
  .accounts({ owner, subscription })
  .rpc();
```

---

## ✅ Completion Status

| Contract | Status | Completion |
|----------|--------|------------|
| **Registry** | ✅ Complete | 100% |
| **Payments** | ✅ Complete | 100% |
| **Scheduler** | ✅ Complete | 100% |

All TODOs have been implemented with professional-grade code including:
- ✅ SPL Token transfers
- ✅ Escrow management
- ✅ Fee collection
- ✅ Refund mechanisms
- ✅ Balance management
- ✅ Event emissions
- ✅ Error handling

---

**Built with ❤️ for Solana Hyperdrive Hackathon**
