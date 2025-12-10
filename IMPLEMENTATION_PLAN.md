# 🚀 SynapsePay - خطة التنفيذ التقنية الشاملة

## 📋 نظرة عامة

هذا الدليل يوضح خطوات تطوير مشروع SynapsePay بالكامل من الصفر إلى الاختبار والتشغيل.

---

## 📊 تحليل الوضع الحالي

### ✅ ما تم إنجازه (الملفات الموجودة)

| المكون | الحالة | الملفات |
|--------|--------|---------|
| **Anchor Programs Structure** | ✅ موجود | `programs/synapsepay-payments/src/lib.rs` |
| **X402 Library** | ✅ موجود | `packages/x402-solana/src/` (5 files) |
| **Facilitator Server Structure** | ✅ موجود | `apps/x402-facilitator/src/server.ts` |
| **Resource Server Structure** | ✅ موجود | `apps/resource-server/src/server.ts` |
| **Frontend (Web)** | ✅ شغال | `apps/web/` (Full React app) |
| **IoT Components** | ✅ كامل | `apps/web/src/components/device/` |

### ⚠️ ما يحتاج استكمال

| المكون | الحالة | الأولوية |
|--------|--------|----------|
| **Anchor Instructions (Rust)** | ⚠️ جزئي | 🔴 عالية |
| **Backend API Routes** | ⚠️ جزئي | 🔴 عالية |
| **Hooks (React)** | ❌ فارغ | 🟡 متوسطة |
| **Real Integration** | ❌ ناقص | 🔴 عالية |
| **Tests** | ❌ ناقص | 🟡 متوسطة |

---

## 🎯 خطة التنفيذ - التسلسل الصحيح

```
═══════════════════════════════════════════════════════════════════════════════
                        ترتيب التنفيذ (من الأسفل للأعلى)
═══════════════════════════════════════════════════════════════════════════════

    ┌─────────────────────────────────────────────────────────────────────┐
    │                    Phase 6: Testing & Demo                          │
    │                    ────────────────────────                         │
    │    E2E Tests → Integration Tests → Demo Video → Submission          │
    └─────────────────────────────────────────────────────────────────────┘
                                    ▲
    ┌─────────────────────────────────────────────────────────────────────┐
    │                    Phase 5: Frontend Integration                    │
    │                    ─────────────────────────────                    │
    │    usePayment Hook → PaymentModal → Agent Execution Flow            │
    └─────────────────────────────────────────────────────────────────────┘
                                    ▲
    ┌─────────────────────────────────────────────────────────────────────┐
    │                    Phase 4: Backend Services                        │
    │                    ─────────────────────────                        │
    │    Facilitator API → Resource Server → Actions API                  │
    └─────────────────────────────────────────────────────────────────────┘
                                    ▲
    ┌─────────────────────────────────────────────────────────────────────┐
    │                    Phase 3: X402 Protocol Library                   │
    │                    ──────────────────────────────                   │
    │    Payload Encoding → Signature Verification → Middleware           │
    └─────────────────────────────────────────────────────────────────────┘
                                    ▲
    ┌─────────────────────────────────────────────────────────────────────┐
    │                    Phase 2: Anchor Programs                         │
    │                    ────────────────────────                         │
    │    Registry → Payments → Scheduler                                  │
    └─────────────────────────────────────────────────────────────────────┘
                                    ▲
    ┌─────────────────────────────────────────────────────────────────────┐
    │                    Phase 1: Environment Setup                       │
    │                    ──────────────────────────                       │
    │    Solana CLI → Anchor → Dependencies → Environment Variables       │
    └─────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
```

---

# 📦 Phase 1: Environment Setup
## المدة المتوقعة: 30 دقيقة

### Step 1.1: التحقق من المتطلبات

```bash
# تأكد من تثبيت الأدوات
node --version       # يجب أن يكون 18+
bun --version        # أو npm
solana --version     # يجب أن يكون 1.17+
anchor --version     # يجب أن يكون 0.29+
```

### Step 1.2: تثبيت Solana CLI و Anchor (إذا غير موجود)

```bash
# تثبيت Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.18.4/install)"

# تثبيت Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
```

### Step 1.3: إعداد المحفظة للتطوير

```bash
# إنشاء محفظة جديدة للتطوير
solana-keygen new --outfile ~/.config/solana/devnet-wallet.json

# التبديل لشبكة Devnet
solana config set --url https://api.devnet.solana.com

# الحصول على SOL مجاني للاختبار
solana airdrop 2
```

### Step 1.4: إعداد Environment Variables

```bash
cd /Users/s/Solana-SynapsePay

# نسخ ملف الإعدادات
cp .env.example .env

# تحرير الإعدادات
open .env
```

**الإعدادات المطلوبة في `.env`:**

```env
# Solana
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com

# Facilitator - مفتاح المحفظة (Base58)
FACILITATOR_PRIVATE_KEY=<your_base58_private_key>

# AI (اختياري للـ Demo)
OPENAI_API_KEY=sk-your-key-here

# Frontend
VITE_SOLANA_NETWORK=devnet
VITE_FACILITATOR_URL=http://localhost:8403
VITE_RESOURCE_SERVER_URL=http://localhost:8404
```

### Step 1.5: تثبيت Dependencies

```bash
cd /Users/s/Solana-SynapsePay

# تثبيت جميع الـ dependencies
bun install

# أو باستخدام npm
npm install
```

---

# ⛓️ Phase 2: Anchor Programs (Smart Contracts)
## المدة المتوقعة: 2-3 ساعات
## 📁 المجلد: `programs/`

### Step 2.1: Registry Program - تسجيل الـ Agents

**الملف:** `programs/synapsepay-registry/src/lib.rs`

```rust
use anchor_lang::prelude::*;

declare_id!("SYNRegistry111111111111111111111111111111111");

#[program]
pub mod synapsepay_registry {
    use super::*;

    pub fn register_agent(
        ctx: Context<RegisterAgent>,
        agent_id: String,
        metadata_cid: String,
        price: u64,
        category: AgentCategory,
    ) -> Result<()> {
        let agent = &mut ctx.accounts.agent;
        let clock = Clock::get()?;
        
        agent.owner = ctx.accounts.owner.key();
        agent.agent_id = agent_id;
        agent.metadata_cid = metadata_cid;
        agent.price = price;
        agent.category = category;
        agent.total_runs = 0;
        agent.total_earned = 0;
        agent.rating = 0;
        agent.is_active = true;
        agent.created_at = clock.unix_timestamp;
        agent.updated_at = clock.unix_timestamp;
        
        Ok(())
    }

    pub fn update_agent(
        ctx: Context<UpdateAgent>,
        new_metadata_cid: Option<String>,
        new_price: Option<u64>,
    ) -> Result<()> {
        let agent = &mut ctx.accounts.agent;
        let clock = Clock::get()?;
        
        require!(agent.owner == ctx.accounts.owner.key(), RegistryError::Unauthorized);
        
        if let Some(cid) = new_metadata_cid {
            agent.metadata_cid = cid;
        }
        if let Some(price) = new_price {
            agent.price = price;
        }
        agent.updated_at = clock.unix_timestamp;
        
        Ok(())
    }

    pub fn deactivate_agent(ctx: Context<DeactivateAgent>) -> Result<()> {
        let agent = &mut ctx.accounts.agent;
        require!(agent.owner == ctx.accounts.owner.key(), RegistryError::Unauthorized);
        agent.is_active = false;
        Ok(())
    }

    pub fn increment_runs(ctx: Context<IncrementRuns>, earned: u64) -> Result<()> {
        let agent = &mut ctx.accounts.agent;
        agent.total_runs += 1;
        agent.total_earned += earned;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(agent_id: String)]
pub struct RegisterAgent<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + Agent::INIT_SPACE,
        seeds = [b"agent", agent_id.as_bytes()],
        bump
    )]
    pub agent: Account<'info, Agent>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateAgent<'info> {
    #[account(mut)]
    pub agent: Account<'info, Agent>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct DeactivateAgent<'info> {
    #[account(mut)]
    pub agent: Account<'info, Agent>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct IncrementRuns<'info> {
    #[account(mut)]
    pub agent: Account<'info, Agent>,
    /// CHECK: Authority account
    pub authority: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct Agent {
    pub owner: Pubkey,
    #[max_len(64)]
    pub agent_id: String,
    #[max_len(64)]
    pub metadata_cid: String,
    pub price: u64,
    pub category: AgentCategory,
    pub total_runs: u64,
    pub total_earned: u64,
    pub rating: u16,
    pub is_active: bool,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum AgentCategory {
    AI,
    IoT,
    Automation,
    Utility,
    Trading,
    NFT,
}

#[error_code]
pub enum RegistryError {
    #[msg("Unauthorized")]
    Unauthorized,
}
```

### Step 2.2: Payments Program - المدفوعات

**الملف:** `programs/synapsepay-payments/src/instructions/` (تحتاج ملفات متعددة)

**الملف: `create_invoice.rs`**

```rust
use anchor_lang::prelude::*;
use crate::state::*;

pub fn handler(
    ctx: Context<CreateInvoice>,
    agent_id: String,
    amount: u64,
    expires_at: i64,
) -> Result<()> {
    let invoice = &mut ctx.accounts.invoice;
    let clock = Clock::get()?;
    
    invoice.invoice_id = ctx.accounts.invoice.key();
    invoice.payer = ctx.accounts.payer.key();
    invoice.recipient = ctx.accounts.recipient.key();
    invoice.agent_id = agent_id;
    invoice.amount = amount;
    invoice.state = PaymentState::InvoiceCreated;
    invoice.expires_at = expires_at;
    invoice.created_at = clock.unix_timestamp;
    invoice.nonce = clock.unix_timestamp as u64;
    
    Ok(())
}

#[derive(Accounts)]
#[instruction(agent_id: String)]
pub struct CreateInvoice<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + Invoice::INIT_SPACE,
        seeds = [b"invoice", payer.key().as_ref(), agent_id.as_bytes()],
        bump
    )]
    pub invoice: Account<'info, Invoice>,
    
    #[account(mut)]
    pub payer: Signer<'info>,
    
    /// CHECK: Recipient wallet
    pub recipient: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}
```

**الملف: `settle_payment.rs`**

```rust
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;

pub fn handler(
    ctx: Context<SettlePayment>,
    _signature: [u8; 64],
) -> Result<()> {
    let invoice = &mut ctx.accounts.invoice;
    let clock = Clock::get()?;
    
    // Verify not expired
    require!(clock.unix_timestamp < invoice.expires_at, PaymentError::InvoiceExpired);
    
    // Verify state
    require!(
        invoice.state == PaymentState::InvoiceCreated,
        PaymentError::InvalidState
    );
    
    // Transfer USDC from payer to escrow
    let cpi_accounts = Transfer {
        from: ctx.accounts.payer_token.to_account_info(),
        to: ctx.accounts.escrow_token.to_account_info(),
        authority: ctx.accounts.payer.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    token::transfer(cpi_ctx, invoice.amount)?;
    
    // Update state
    invoice.state = PaymentState::Pending;
    
    Ok(())
}

#[derive(Accounts)]
pub struct SettlePayment<'info> {
    #[account(mut)]
    pub invoice: Account<'info, Invoice>,
    
    #[account(mut)]
    pub payer: Signer<'info>,
    
    #[account(mut)]
    pub payer_token: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub escrow_token: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[error_code]
pub enum PaymentError {
    #[msg("Invoice expired")]
    InvoiceExpired,
    #[msg("Invalid payment state")]
    InvalidState,
    #[msg("Invalid signature")]
    InvalidSignature,
    #[msg("Nonce already used")]
    NonceAlreadyUsed,
}
```

### Step 2.3: Build و Deploy البرامج

```bash
cd /Users/s/Solana-SynapsePay

# بناء البرامج
anchor build

# Deploy على Devnet
anchor deploy --provider.cluster devnet

# الحصول على Program IDs
solana program show --programs
```

### Step 2.4: تحديث Program IDs

بعد الـ Deploy، حدّث الـ IDs في:
- `Anchor.toml`
- `.env`
- `apps/web/src/config/solana.ts`

---

# 📦 Phase 3: X402 Protocol Library
## المدة المتوقعة: 1-2 ساعة
## 📁 المجلد: `packages/x402-solana/`

### Step 3.1: Types Definition

**الملف:** `packages/x402-solana/src/types.ts`

```typescript
import { PublicKey } from '@solana/web3.js';

export interface X402PaymentPayload {
  version: string;
  paymentType: 'solana';
  network: 'devnet' | 'mainnet-beta';
  payload: SolanaPaymentPayload;
}

export interface SolanaPaymentPayload {
  paymentId: string;
  payer: string;
  recipient: string;
  amount: string;
  tokenMint: string;
  agentId: string;
  taskMetadata?: Record<string, any>;
  expiresAt: number;
  nonce: number;
  transactionSignature?: {
    signature: string;
    publicKey: string;
  };
  paymentIntentSignature?: {
    signature: string;
    nonce: number;
  };
}

export interface InvoiceRequest {
  agentId: string;
  amount: string;
  payer: string;
  recipient?: string;
  taskMetadata?: Record<string, any>;
}

export interface InvoiceResponse {
  invoiceId: string;
  amount: string;
  currency: string;
  recipient: string;
  expiresAt: number;
  network: string;
  paymentPayload: X402PaymentPayload;
}

export interface SettlementResponse {
  success: boolean;
  txSignature: string;
  slot: number;
  receiptId?: string;
}

export type PaymentState = 
  | 'idle'
  | 'creating_invoice'
  | 'awaiting_permit'
  | 'awaiting_intent'
  | 'verifying'
  | 'settling'
  | 'executing'
  | 'completed'
  | 'failed';
```

### Step 3.2: Payload Encoding/Decoding

**الملف:** `packages/x402-solana/src/payload.ts`

```typescript
import { X402PaymentPayload, SolanaPaymentPayload } from './types';
import bs58 from 'bs58';

export function encodePayload(payload: X402PaymentPayload): string {
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  return Buffer.from(bytes).toString('base64');
}

export function decodePayload(encoded: string): X402PaymentPayload {
  const bytes = Buffer.from(encoded, 'base64');
  const json = new TextDecoder().decode(bytes);
  return JSON.parse(json) as X402PaymentPayload;
}

export function createPaymentPayload(
  params: {
    paymentId: string;
    payer: string;
    recipient: string;
    amount: string;
    agentId: string;
    tokenMint: string;
    network: 'devnet' | 'mainnet-beta';
    expiresAt?: number;
    taskMetadata?: Record<string, any>;
  }
): X402PaymentPayload {
  const now = Date.now();
  
  return {
    version: '1.0',
    paymentType: 'solana',
    network: params.network,
    payload: {
      paymentId: params.paymentId,
      payer: params.payer,
      recipient: params.recipient,
      amount: params.amount,
      tokenMint: params.tokenMint,
      agentId: params.agentId,
      taskMetadata: params.taskMetadata,
      expiresAt: params.expiresAt || now + 5 * 60 * 1000, // 5 minutes
      nonce: now,
    },
  };
}

export function createXPaymentHeader(payload: X402PaymentPayload): string {
  return encodePayload(payload);
}

export function parseXPaymentHeader(header: string): X402PaymentPayload | null {
  try {
    return decodePayload(header);
  } catch {
    return null;
  }
}
```

### Step 3.3: Signature Functions

**الملف:** `packages/x402-solana/src/signatures.ts`

```typescript
import { Keypair, PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

export interface SignedMessage {
  signature: string;
  publicKey: string;
  message: string;
}

export async function signPaymentIntent(
  message: Uint8Array,
  signMessage: (message: Uint8Array) => Promise<Uint8Array>,
  publicKey: PublicKey
): Promise<SignedMessage> {
  const signature = await signMessage(message);
  
  return {
    signature: bs58.encode(signature),
    publicKey: publicKey.toBase58(),
    message: bs58.encode(message),
  };
}

export function verifySignature(
  signature: string,
  message: string,
  publicKey: string
): boolean {
  try {
    const signatureBytes = bs58.decode(signature);
    const messageBytes = bs58.decode(message);
    const publicKeyBytes = bs58.decode(publicKey);
    
    return nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKeyBytes
    );
  } catch {
    return false;
  }
}

export function createPaymentIntentMessage(
  paymentId: string,
  amount: string,
  recipient: string,
  nonce: number
): Uint8Array {
  const message = `SynapsePay Payment Intent\n` +
    `Payment ID: ${paymentId}\n` +
    `Amount: ${amount} USDC\n` +
    `Recipient: ${recipient}\n` +
    `Nonce: ${nonce}`;
  
  return new TextEncoder().encode(message);
}
```

### Step 3.4: Middleware for Backend

**الملف:** `packages/x402-solana/src/middleware.ts`

```typescript
import { Context, Next } from 'hono';
import { parseXPaymentHeader } from './payload';
import { verifySignature } from './signatures';
import { X402PaymentPayload } from './types';

export interface X402Context {
  payment?: X402PaymentPayload;
  isValid: boolean;
  error?: string;
}

export async function x402Middleware(c: Context, next: Next) {
  const xPaymentHeader = c.req.header('X-PAYMENT');
  
  if (!xPaymentHeader) {
    // Return 402 Payment Required
    return c.json({
      error: 'Payment Required',
      code: 402,
      message: 'X-PAYMENT header is required',
    }, 402);
  }
  
  const payload = parseXPaymentHeader(xPaymentHeader);
  
  if (!payload) {
    return c.json({
      error: 'Invalid Payment',
      code: 400,
      message: 'Could not parse X-PAYMENT header',
    }, 400);
  }
  
  // Verify expiry
  if (Date.now() > payload.payload.expiresAt) {
    return c.json({
      error: 'Payment Expired',
      code: 400,
      message: 'Payment has expired',
    }, 400);
  }
  
  // Verify signatures if present
  if (payload.payload.paymentIntentSignature) {
    const isValid = verifySignature(
      payload.payload.paymentIntentSignature.signature,
      payload.payload.paymentId,
      payload.payload.payer
    );
    
    if (!isValid) {
      return c.json({
        error: 'Invalid Signature',
        code: 401,
        message: 'Payment signature verification failed',
      }, 401);
    }
  }
  
  // Attach payment to context
  c.set('x402Payment', payload);
  
  await next();
}

export function getPaymentFromContext(c: Context): X402PaymentPayload | undefined {
  return c.get('x402Payment');
}
```

### Step 3.5: Export Index

**الملف:** `packages/x402-solana/src/index.ts`

```typescript
export * from './types';
export * from './payload';
export * from './signatures';
export * from './middleware';
```

---

# 🔧 Phase 4: Backend Services
## المدة المتوقعة: 2-3 ساعات
## 📁 المجلدات: `apps/x402-facilitator/` و `apps/resource-server/`

### Step 4.1: X402 Facilitator - Main Server

**الملف:** `apps/x402-facilitator/src/server.ts`

```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { invoiceRoutes } from './routes/invoice';
import { verifyRoutes } from './routes/verify';
import { settleRoutes } from './routes/settle';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'X-PAYMENT'],
}));

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'x402-facilitator',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.route('/invoice', invoiceRoutes);
app.route('/verify', verifyRoutes);
app.route('/settle', settleRoutes);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json({ error: 'Internal Server Error' }, 500);
});

const port = process.env.FACILITATOR_PORT || 8403;

console.log(`🚀 X402 Facilitator running on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};
```

### Step 4.2: Invoice Route

**الملف:** `apps/x402-facilitator/src/routes/invoice.ts`

```typescript
import { Hono } from 'hono';
import { createPaymentPayload, encodePayload } from '@synapsepay/x402-solana';
import { v4 as uuidv4 } from 'uuid';
import bs58 from 'bs58';

const app = new Hono();

// Agent prices (in USDC, 6 decimals)
const AGENT_PRICES: Record<string, number> = {
  'pdf-summarizer-v1': 50000,      // 0.05 USDC
  'image-editor-v1': 100000,       // 0.10 USDC
  'nft-minter-v1': 250000,         // 0.25 USDC
  'code-debugger-v1': 80000,       // 0.08 USDC
  'ugv-rover-01': 100000,          // 0.10 USDC
  'smart-led-array': 50000,        // 0.05 USDC
};

// Agent recipients (owner wallets)
const AGENT_RECIPIENTS: Record<string, string> = {
  'pdf-summarizer-v1': 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
  'image-editor-v1': 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
  'nft-minter-v1': 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
  'code-debugger-v1': 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
  'ugv-rover-01': 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
  'smart-led-array': 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
};

const USDC_MINT = {
  devnet: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
  'mainnet-beta': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
};

app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { agentId, payer, taskMetadata } = body;
    
    if (!agentId || !payer) {
      return c.json({ error: 'Missing required fields' }, 400);
    }
    
    const amount = AGENT_PRICES[agentId];
    if (!amount) {
      return c.json({ error: 'Unknown agent' }, 404);
    }
    
    const recipient = AGENT_RECIPIENTS[agentId];
    const network = (process.env.SOLANA_NETWORK || 'devnet') as 'devnet' | 'mainnet-beta';
    const paymentId = bs58.encode(Buffer.from(uuidv4().replace(/-/g, ''), 'hex'));
    
    const payload = createPaymentPayload({
      paymentId,
      payer,
      recipient,
      amount: amount.toString(),
      agentId,
      tokenMint: USDC_MINT[network],
      network,
      taskMetadata,
    });
    
    return c.json({
      invoiceId: paymentId,
      amount: amount.toString(),
      amountDisplay: `${(amount / 1_000_000).toFixed(2)} USDC`,
      currency: 'USDC',
      recipient,
      expiresAt: payload.payload.expiresAt,
      network,
      paymentPayload: payload,
      xPaymentHeader: encodePayload(payload),
    });
  } catch (error) {
    console.error('Invoice creation error:', error);
    return c.json({ error: 'Failed to create invoice' }, 500);
  }
});

app.get('/status/:invoiceId', async (c) => {
  const invoiceId = c.req.param('invoiceId');
  
  // In production, fetch from database
  // For demo, return mock status
  return c.json({
    invoiceId,
    status: 'pending',
    createdAt: new Date().toISOString(),
  });
});

export { app as invoiceRoutes };
```

### Step 4.3: Verify Route

**الملف:** `apps/x402-facilitator/src/routes/verify.ts`

```typescript
import { Hono } from 'hono';
import { parseXPaymentHeader, verifySignature } from '@synapsepay/x402-solana';

const app = new Hono();

app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { xPaymentHeader } = body;
    
    if (!xPaymentHeader) {
      return c.json({ valid: false, error: 'Missing X-PAYMENT header' }, 400);
    }
    
    const payload = parseXPaymentHeader(xPaymentHeader);
    if (!payload) {
      return c.json({ valid: false, error: 'Invalid payload format' }, 400);
    }
    
    // Check expiry
    if (Date.now() > payload.payload.expiresAt) {
      return c.json({ valid: false, error: 'Payment expired' }, 400);
    }
    
    // Verify signature if present
    if (payload.payload.paymentIntentSignature) {
      const isValid = verifySignature(
        payload.payload.paymentIntentSignature.signature,
        payload.payload.paymentId,
        payload.payload.payer
      );
      
      if (!isValid) {
        return c.json({ valid: false, error: 'Invalid signature' }, 401);
      }
    }
    
    return c.json({
      valid: true,
      payload: payload.payload,
      expiresIn: payload.payload.expiresAt - Date.now(),
    });
  } catch (error) {
    console.error('Verification error:', error);
    return c.json({ valid: false, error: 'Verification failed' }, 500);
  }
});

export { app as verifyRoutes };
```

### Step 4.4: Settle Route

**الملف:** `apps/x402-facilitator/src/routes/settle.ts`

```typescript
import { Hono } from 'hono';
import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { 
  getAssociatedTokenAddress, 
  createTransferInstruction,
  getAccount
} from '@solana/spl-token';
import { parseXPaymentHeader } from '@synapsepay/x402-solana';
import bs58 from 'bs58';

const app = new Hono();

// Initialize connection
const connection = new Connection(
  process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  'confirmed'
);

// Facilitator wallet (pays gas, gets refunded from payment)
let facilitatorKeypair: Keypair | null = null;

try {
  const privateKey = process.env.FACILITATOR_PRIVATE_KEY;
  if (privateKey) {
    facilitatorKeypair = Keypair.fromSecretKey(bs58.decode(privateKey));
    console.log('Facilitator wallet:', facilitatorKeypair.publicKey.toBase58());
  }
} catch (e) {
  console.warn('Facilitator keypair not configured');
}

app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { xPaymentHeader, signedTransaction } = body;
    
    if (!xPaymentHeader) {
      return c.json({ success: false, error: 'Missing payment header' }, 400);
    }
    
    const payload = parseXPaymentHeader(xPaymentHeader);
    if (!payload) {
      return c.json({ success: false, error: 'Invalid payload' }, 400);
    }
    
    // Check expiry
    if (Date.now() > payload.payload.expiresAt) {
      return c.json({ success: false, error: 'Payment expired' }, 400);
    }
    
    // For demo mode - simulate successful settlement
    if (!facilitatorKeypair || !signedTransaction) {
      console.log('Demo mode: Simulating settlement');
      
      return c.json({
        success: true,
        mode: 'demo',
        txSignature: `demo_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        slot: Math.floor(Math.random() * 1000000) + 250000000,
        amount: payload.payload.amount,
        payer: payload.payload.payer,
        recipient: payload.payload.recipient,
        settledAt: new Date().toISOString(),
      });
    }
    
    // Real settlement flow
    const transaction = Transaction.from(Buffer.from(signedTransaction, 'base64'));
    
    // Send transaction
    const txSignature = await connection.sendRawTransaction(
      transaction.serialize(),
      { skipPreflight: false }
    );
    
    // Confirm transaction
    const confirmation = await connection.confirmTransaction(txSignature, 'confirmed');
    
    if (confirmation.value.err) {
      return c.json({ 
        success: false, 
        error: 'Transaction failed', 
        details: confirmation.value.err 
      }, 400);
    }
    
    return c.json({
      success: true,
      txSignature,
      slot: confirmation.context.slot,
      amount: payload.payload.amount,
      payer: payload.payload.payer,
      recipient: payload.payload.recipient,
      settledAt: new Date().toISOString(),
      explorerUrl: `https://explorer.solana.com/tx/${txSignature}?cluster=devnet`,
    });
    
  } catch (error) {
    console.error('Settlement error:', error);
    return c.json({ 
      success: false, 
      error: 'Settlement failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export { app as settleRoutes };
```

### Step 4.5: Resource Server - AI Agent Execution

**الملف:** `apps/resource-server/src/server.ts`

```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { x402Middleware, getPaymentFromContext } from '@synapsepay/x402-solana';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'X-PAYMENT'],
}));

// Health check (no payment required)
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'resource-server',
    timestamp: new Date().toISOString(),
  });
});

// List agents (no payment required)
app.get('/agents', (c) => {
  return c.json({
    agents: [
      {
        id: 'pdf-summarizer-v1',
        name: 'PDF Summarizer',
        description: 'AI-powered PDF summary extraction',
        price: 50000,
        priceDisplay: '0.05 USDC',
        category: 'AI',
        rating: 4.8,
        totalRuns: 1250,
      },
      {
        id: 'image-editor-v1',
        name: 'Image Editor',
        description: 'Remove background, resize, apply filters',
        price: 100000,
        priceDisplay: '0.10 USDC',
        category: 'AI',
        rating: 4.6,
        totalRuns: 890,
      },
      {
        id: 'nft-minter-v1',
        name: 'NFT Minter',
        description: 'Generate and mint NFT from image',
        price: 250000,
        priceDisplay: '0.25 USDC',
        category: 'NFT',
        rating: 4.9,
        totalRuns: 650,
      },
      {
        id: 'ugv-rover-01',
        name: 'UGV Rover 01',
        description: 'Control physical robot with live camera',
        price: 100000,
        priceDisplay: '0.10 USDC',
        category: 'IoT',
        duration: 600, // 10 minutes
        rating: 4.7,
        totalRuns: 320,
      },
    ],
  });
});

// Execute agent (payment required)
app.post('/agent/execute', x402Middleware, async (c) => {
  const payment = getPaymentFromContext(c);
  
  if (!payment) {
    return c.json({ error: 'Payment not found' }, 402);
  }
  
  const body = await c.req.json();
  const { agentId, taskParams } = body;
  
  // Simulate AI execution
  console.log(`Executing agent: ${agentId}`);
  console.log(`Payment: ${payment.payload.amount} from ${payment.payload.payer}`);
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Return mock result based on agent
  let result;
  switch (agentId) {
    case 'pdf-summarizer-v1':
      result = {
        summary: 'This document discusses the key aspects of blockchain technology...',
        keyPoints: [
          'Decentralization enables trustless transactions',
          'Smart contracts automate complex processes',
          'Micropayments become economically viable',
        ],
        wordCount: 150,
      };
      break;
    case 'nft-minter-v1':
      result = {
        mintAddress: 'NFT' + Math.random().toString(36).slice(2, 10).toUpperCase(),
        metadataUri: 'https://arweave.net/example-metadata',
        explorerUrl: 'https://explorer.solana.com/address/...',
      };
      break;
    default:
      result = {
        success: true,
        message: `Agent ${agentId} executed successfully`,
        timestamp: new Date().toISOString(),
      };
  }
  
  return c.json({
    taskId: `task_${Date.now()}`,
    status: 'completed',
    result,
    executionTime: 2000,
    payment: {
      amount: payment.payload.amount,
      payer: payment.payload.payer,
    },
  });
});

// Device command (for IoT)
app.post('/device/command', x402Middleware, async (c) => {
  const payment = getPaymentFromContext(c);
  const body = await c.req.json();
  const { deviceId, command, params } = body;
  
  console.log(`Device command: ${command} to ${deviceId}`);
  
  // Simulate device response
  return c.json({
    success: true,
    deviceId,
    command,
    response: 'ACK',
    timestamp: new Date().toISOString(),
  });
});

const port = process.env.RESOURCE_SERVER_PORT || 8404;

console.log(`🤖 Resource Server running on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};
```

### Step 4.6: تشغيل Backend Services

```bash
# Terminal 1: Facilitator
cd /Users/s/Solana-SynapsePay/apps/x402-facilitator
bun run dev

# Terminal 2: Resource Server
cd /Users/s/Solana-SynapsePay/apps/resource-server
bun run dev
```

---

# 🎨 Phase 5: Frontend Integration
## المدة المتوقعة: 2-3 ساعات
## 📁 المجلد: `apps/web/src/`

### Step 5.1: Payment Hook

**الملف:** `apps/web/src/hooks/usePayment.ts`

```typescript
import { useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { 
  createPaymentIntentMessage, 
  signPaymentIntent,
  createXPaymentHeader 
} from '@synapsepay/x402-solana';

export type PaymentState = 
  | 'idle'
  | 'creating_invoice'
  | 'awaiting_permit'
  | 'awaiting_intent'
  | 'settling'
  | 'executing'
  | 'completed'
  | 'failed';

interface UsePaymentOptions {
  facilitatorUrl: string;
  resourceServerUrl: string;
}

interface PaymentResult {
  success: boolean;
  txSignature?: string;
  result?: any;
  error?: string;
}

export function usePayment(options: UsePaymentOptions) {
  const { publicKey, signMessage } = useWallet();
  const [state, setState] = useState<PaymentState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const executePayment = useCallback(async (
    agentId: string,
    taskParams?: Record<string, any>
  ): Promise<PaymentResult> => {
    if (!publicKey || !signMessage) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      setError(null);
      setLogs([]);
      
      // Step 1: Create Invoice
      setState('creating_invoice');
      addLog('Creating payment invoice...');
      
      const invoiceRes = await fetch(`${options.facilitatorUrl}/invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          payer: publicKey.toBase58(),
          taskMetadata: taskParams,
        }),
      });
      
      if (!invoiceRes.ok) {
        throw new Error('Failed to create invoice');
      }
      
      const invoice = await invoiceRes.json();
      addLog(`✓ Invoice created: ${invoice.amountDisplay}`);
      
      // Step 2: Sign Permit (USDC approval)
      setState('awaiting_permit');
      addLog('Requesting USDC-SPL token approval signature...');
      
      // In real implementation, this would be a Solana transaction
      // For demo, we simulate with a message signature
      const permitMessage = `Approve ${invoice.amountDisplay} for ${agentId}`;
      const permitBytes = new TextEncoder().encode(permitMessage);
      
      await signMessage(permitBytes);
      addLog('✓ Permit signature received');
      
      // Step 3: Sign Payment Intent
      setState('awaiting_intent');
      addLog('Requesting payment intent signature...');
      
      const intentMessage = createPaymentIntentMessage(
        invoice.invoiceId,
        invoice.amountDisplay,
        invoice.recipient,
        Date.now()
      );
      
      const intentSignature = await signMessage(intentMessage);
      addLog('✓ Payment intent signed');
      
      // Step 4: Settle Payment
      setState('settling');
      addLog('Submitting to Solana network...');
      
      const settleRes = await fetch(`${options.facilitatorUrl}/settle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          xPaymentHeader: invoice.xPaymentHeader,
          // In real implementation, include signed transaction
        }),
      });
      
      if (!settleRes.ok) {
        throw new Error('Settlement failed');
      }
      
      const settlement = await settleRes.json();
      addLog(`✓ Payment settled: ${invoice.amountDisplay} transferred`);
      
      // Step 5: Execute Agent
      setState('executing');
      addLog('Executing AI agent...');
      
      const executeRes = await fetch(`${options.resourceServerUrl}/agent/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-PAYMENT': invoice.xPaymentHeader,
        },
        body: JSON.stringify({
          agentId,
          taskParams,
        }),
      });
      
      if (!executeRes.ok) {
        throw new Error('Agent execution failed');
      }
      
      const result = await executeRes.json();
      addLog('✓ Task completed successfully');
      
      setState('completed');
      
      return {
        success: true,
        txSignature: settlement.txSignature,
        result: result.result,
      };
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setState('failed');
      setError(errorMessage);
      addLog(`✗ Error: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }, [publicKey, signMessage, options]);

  const reset = useCallback(() => {
    setState('idle');
    setError(null);
    setLogs([]);
  }, []);

  return {
    state,
    error,
    logs,
    executePayment,
    reset,
    isProcessing: !['idle', 'completed', 'failed'].includes(state),
  };
}
```

### Step 5.2: Agent Hook

**الملف:** `apps/web/src/hooks/useAgents.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';

interface Agent {
  id: string;
  name: string;
  description: string;
  price: number;
  priceDisplay: string;
  category: string;
  rating: number;
  totalRuns: number;
  duration?: number;
}

export function useAgents(resourceServerUrl: string) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${resourceServerUrl}/agents`);
      
      if (!res.ok) {
        throw new Error('Failed to fetch agents');
      }
      
      const data = await res.json();
      setAgents(data.agents);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [resourceServerUrl]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const getAgentById = useCallback((id: string) => {
    return agents.find(agent => agent.id === id);
  }, [agents]);

  const getAgentsByCategory = useCallback((category: string) => {
    return agents.filter(agent => agent.category === category);
  }, [agents]);

  return {
    agents,
    loading,
    error,
    refetch: fetchAgents,
    getAgentById,
    getAgentsByCategory,
  };
}
```

### Step 5.3: تحديث Config

**الملف:** `apps/web/src/config/endpoints.ts`

```typescript
export const config = {
  facilitatorUrl: import.meta.env.VITE_FACILITATOR_URL || 'http://localhost:8403',
  resourceServerUrl: import.meta.env.VITE_RESOURCE_SERVER_URL || 'http://localhost:8404',
  actionsApiUrl: import.meta.env.VITE_ACTIONS_API_URL || 'http://localhost:8405',
  
  solana: {
    network: import.meta.env.VITE_SOLANA_NETWORK || 'devnet',
    rpcUrl: import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  },
  
  tokens: {
    usdc: {
      devnet: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
      'mainnet-beta': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    },
  },
};
```

---

# 🧪 Phase 6: Testing & Demo
## المدة المتوقعة: 1-2 ساعة

### Step 6.1: تشغيل جميع الخدمات

```bash
# Terminal 1: Frontend
cd /Users/s/Solana-SynapsePay/apps/web
npm run dev
# → http://localhost:5174

# Terminal 2: Facilitator
cd /Users/s/Solana-SynapsePay/apps/x402-facilitator
bun run dev
# → http://localhost:8403

# Terminal 3: Resource Server
cd /Users/s/Solana-SynapsePay/apps/resource-server
bun run dev
# → http://localhost:8404
```

### Step 6.2: اختبار API Endpoints

```bash
# Test Facilitator Health
curl http://localhost:8403/health

# Test Create Invoice
curl -X POST http://localhost:8403/invoice \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "pdf-summarizer-v1",
    "payer": "your-wallet-address"
  }'

# Test Resource Server
curl http://localhost:8404/agents
```

### Step 6.3: سيناريو الاختبار الكامل

1. افتح `http://localhost:5174`
2. اضغط على **Connect Wallet** واتصل بـ Phantom
3. اذهب إلى **IoT Devices** → **UGV Rover 01**
4. اضغط **Initialize Payment Sequence**
5. وافق على التوقيعات في Phantom
6. استخدم أزرار WASD للتحكم

---

# 📊 ملخص الخطة

## الجدول الزمني

| المرحلة | المدة | المخرجات |
|---------|-------|----------|
| Phase 1: Environment | 30 mins | Solana CLI, Anchor, Dependencies |
| Phase 2: Anchor Programs | 2-3 hrs | 3 Smart Contracts |
| Phase 3: X402 Library | 1-2 hrs | TypeScript Package |
| Phase 4: Backend | 2-3 hrs | Facilitator + Resource Server |
| Phase 5: Frontend | 2-3 hrs | Hooks + Integration |
| Phase 6: Testing | 1-2 hrs | Working Demo |
| **المجموع** | **9-14 ساعات** | **Full Implementation** |

## ترتيب المجلدات للتنفيذ

```
1️⃣  packages/x402-solana/          ← أولاً: المكتبة الأساسية
2️⃣  programs/synapsepay-registry/  ← ثانياً: Registry Smart Contract
3️⃣  programs/synapsepay-payments/  ← ثالثاً: Payments Smart Contract
4️⃣  apps/x402-facilitator/         ← رابعاً: Payment Gateway
5️⃣  apps/resource-server/          ← خامساً: AI Execution API
6️⃣  apps/web/src/hooks/            ← سادساً: Frontend Hooks
7️⃣  apps/web/src/components/       ← سابعاً: Component Integration
```

---

# ✅ Checklist للهاكاثون

- [ ] Phase 1: Environment Setup
- [ ] Phase 2: Anchor Programs Deployed
- [ ] Phase 3: X402 Library Complete
- [ ] Phase 4: Backend Services Running
- [ ] Phase 5: Frontend Integration
- [ ] Phase 6: Testing Complete
- [ ] Demo Video Recorded (2-4 min)
- [ ] GitHub README Updated
- [ ] Submission Prepared

---

**🎯 الهدف:** تسليم قبل 14 ديسمبر!

**📞 للمساعدة:** ابدأ بأي Phase وسأساعدك خطوة بخطوة!

---

# 🔄 Phase 7: PayBot → Solana Adaptation
## ما يمكن استخدامه من PayBot على Solana

### 📊 مقارنة التقنيات

| العنصر | PayBot (EVM) | SynapsePay (Solana) |
|--------|--------------|---------------------|
| **Smart Contracts** | Solidity (Escrow.sol) | Anchor/Rust (synapsepay-payments) |
| **Token Standard** | ERC-20 (QUSD) | SPL Token (USDC) |
| **Gasless Approval** | EIP-2612 Permit | SPL Token Delegate |
| **Signatures** | EIP-712 (typed data) | Ed25519 (native) |
| **Wallet** | Wagmi + MetaMask | @solana/wallet-adapter + Phantom |
| **RPC** | Viem | @solana/web3.js |
| **Facilitator Pattern** | ✅ Same concept | ✅ Same concept |
| **HTTP 402 Protocol** | ✅ Same | ✅ Same |
| **X-PAYMENT Header** | ✅ Same format | ✅ Same format (adapted) |

---

### ✅ ما يمكن إعادة استخدامه مباشرة

#### 1. **هيكل X402 Protocol**

```typescript
// نفس الهيكل - فقط تغيير paymentType
interface X402PaymentPayload {
  version: "1.0";
  paymentType: "solana";  // بدلاً من "evm-permit"
  network: "devnet" | "mainnet-beta";
  payload: SolanaPaymentPayload;
}
```

#### 2. **حالات الدفعة (Payment States)**

```
نفس التدفق بالضبط:

INVOICE_CREATED → PENDING → EXECUTING → COMPLETED → CLAIMED
                         ↘            ↘
                        FAILED      EXPIRED → REFUNDED
```

#### 3. **Facilitator Server Pattern**

```typescript
// نفس الـ API endpoints
POST /invoice    → إنشاء فاتورة
POST /verify     → التحقق من التوقيع
POST /settle     → تنفيذ الدفع على السلسلة
GET  /status/:id → حالة الدفعة
```

#### 4. **Frontend Components Pattern**

```
BotAccessGate → DeviceAccessGate (نفس المنطق)
PaymentModal → PaymentModal (نفس المنطق)
CountdownTimer → SessionTimer (نفس المنطق)
usePayment hook → usePayment hook (تغيير التنفيذ فقط)
```

---

### 🔧 ما يحتاج تعديل للـ Solana

#### 1. **عقد Escrow → synapsepay-payments**

**PayBot (Solidity):**
```solidity
function createPaymentWithPermit(
    bytes32 paymentId,
    address payer,
    address recipient,
    uint256 amount,
    uint256 duration,
    uint256 deadline,
    uint8 v, bytes32 r, bytes32 s,        // EIP-712 signature
    uint8 permitV, bytes32 permitR, bytes32 permitS  // EIP-2612 permit
) external
```

**SynapsePay (Anchor/Rust):**
```rust
pub fn settle_payment(
    ctx: Context<SettlePayment>,
    payment_id: [u8; 32],
    amount: u64,
    duration: i64,
    signature: [u8; 64],  // Ed25519 signature
) -> Result<()>
// التوقيع مختلف - Ed25519 بدلاً من ECDSA
// لا يوجد Permit - بل Delegate أو Token Transfer
```

#### 2. **توقيع المستخدم**

**PayBot:** المستخدم يوقع مرتين (Permit + PaymentIntent)

**SynapsePay:** المستخدم يوقع مرة واحدة (Transaction أو Message)

```typescript
// Solana - أبسط!
const message = new TextEncoder().encode(
  `SynapsePay Payment\n` +
  `ID: ${paymentId}\n` +
  `Amount: ${amount} USDC\n` +
  `Recipient: ${recipient}\n` +
  `Nonce: ${nonce}`
);

const signature = await wallet.signMessage(message);
```

#### 3. **Token Transfer**

**PayBot:** يستخدم permit() للموافقة بدون gas

**SynapsePay:** يستخدم SPL Token Transfer مباشرة

```typescript
// Solana SPL Token Transfer
import { createTransferInstruction } from '@solana/spl-token';

const transferIx = createTransferInstruction(
  payerTokenAccount,
  escrowTokenAccount,
  payerPublicKey,
  amount
);
```

---

### 📦 الملفات المطلوب إنشاؤها/تعديلها

#### من PayBot → SynapsePay

| PayBot File | SynapsePay Equivalent | الحالة |
|-------------|----------------------|--------|
| `contracts/Escrow.sol` | `programs/synapsepay-payments/` | ✅ موجود جزئياً |
| `contracts/QUSDToken.sol` | لا حاجة (USDC-SPL موجود) | ✅ |
| `x402/types.ts` | `packages/x402-solana/src/types.ts` | ✅ موجود |
| `x402/protocol.ts` | `packages/x402-solana/src/payload.ts` | ✅ موجود |
| `x402/signatures.ts` | `packages/x402-solana/src/signatures.ts` | ✅ موجود |
| `x402/middleware.ts` | `packages/x402-solana/src/middleware.ts` | ✅ موجود |
| `x402/client-helpers.ts` | `packages/x402-solana/src/client-helpers.ts` | ⚠️ يحتاج إضافة |
| `facilitator.ts` | `apps/x402-facilitator/src/facilitator.ts` | ⚠️ يحتاج إضافة |
| `hooks/usePayment.ts` | `apps/web/src/hooks/usePayment.ts` | ⚠️ يحتاج إضافة |
| `BotAccessGate.tsx` | `DeviceAccessGate.tsx` | ✅ موجود |
| `PaymentModal.tsx` | `apps/web/src/components/payment/` | ⚠️ يحتاج تحسين |
| `CountdownTimer.tsx` | موجود في DeviceStatusPanel | ✅ موجود |

---

### 🆕 الملف الجديد: client-helpers.ts (Solana Version)

**الملف:** `packages/x402-solana/src/client-helpers.ts`

```typescript
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { 
  getAssociatedTokenAddress, 
  createTransferInstruction,
  TOKEN_PROGRAM_ID 
} from '@solana/spl-token';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { createPaymentPayload, encodePayload } from './payload';
import { createPaymentIntentMessage, signPaymentIntent } from './signatures';

interface CreateX402HeaderParams {
  connection: Connection;
  wallet: WalletContextState;
  recipient: string;
  amountUsdc: number;
  durationSeconds: number;
  agentId: string;
  network: 'devnet' | 'mainnet-beta';
  usdcMint: string;
}

export async function createX402PaymentHeader(
  params: CreateX402HeaderParams
): Promise<{
  paymentHeader: string;
  paymentId: string;
  payload: any;
}> {
  const { connection, wallet, recipient, amountUsdc, durationSeconds, agentId, network, usdcMint } = params;
  
  if (!wallet.publicKey || !wallet.signMessage) {
    throw new Error('Wallet not connected');
  }
  
  // Generate unique payment ID
  const paymentId = generatePaymentId(wallet.publicKey.toBase58(), agentId);
  
  // Convert amount to lamports (USDC has 6 decimals)
  const amountLamports = Math.floor(amountUsdc * 1_000_000);
  
  // Create payment intent message
  const nonce = Date.now();
  const intentMessage = createPaymentIntentMessage(
    paymentId,
    amountLamports.toString(),
    recipient,
    nonce
  );
  
  // User signs the intent (only ONE signature needed!)
  const signature = await wallet.signMessage(intentMessage);
  
  // Create payload
  const payload = createPaymentPayload({
    paymentId,
    payer: wallet.publicKey.toBase58(),
    recipient,
    amount: amountLamports.toString(),
    agentId,
    tokenMint: usdcMint,
    network,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    taskMetadata: { durationSeconds },
  });
  
  // Add signature to payload
  payload.payload.paymentIntentSignature = {
    signature: Buffer.from(signature).toString('base64'),
    nonce,
  };
  
  // Encode to Base64
  const paymentHeader = encodePayload(payload);
  
  return {
    paymentHeader,
    paymentId,
    payload,
  };
}

function generatePaymentId(payer: string, agentId: string): string {
  const data = `${payer}-${agentId}-${Date.now()}-${Math.random()}`;
  // Simple hash - في الإنتاج استخدم crypto
  return Buffer.from(data).toString('base64').slice(0, 32);
}

// Fetch with automatic 402 handling
export async function fetchWithX402(
  url: string,
  options: RequestInit,
  paymentParams: CreateX402HeaderParams
): Promise<Response> {
  // First try without payment
  const initialResponse = await fetch(url, options);
  
  if (initialResponse.status !== 402) {
    return initialResponse;
  }
  
  // 402 received - create payment
  const { paymentHeader } = await createX402PaymentHeader(paymentParams);
  
  // Retry with payment header
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'X-PAYMENT': paymentHeader,
    },
  });
}
```

---

### 🆕 الملف الجديد: facilitator.ts (Solana Version)

**الملف:** `apps/x402-facilitator/src/facilitator.ts`

```typescript
import { 
  Connection, 
  Keypair, 
  PublicKey, 
  Transaction,
  sendAndConfirmTransaction 
} from '@solana/web3.js';
import { 
  getAssociatedTokenAddress,
  createTransferInstruction,
  TOKEN_PROGRAM_ID
} from '@solana/spl-token';
import { parseXPaymentHeader, verifySignature } from '@synapsepay/x402-solana';

interface FacilitatorConfig {
  connection: Connection;
  facilitatorKeypair: Keypair;  // Facilitator wallet (pays gas)
  escrowWallet: PublicKey;       // Where payments go
  usdcMint: PublicKey;
}

export class PaymentFacilitator {
  private connection: Connection;
  private facilitatorKeypair: Keypair;
  private escrowWallet: PublicKey;
  private usdcMint: PublicKey;
  
  constructor(config: FacilitatorConfig) {
    this.connection = config.connection;
    this.facilitatorKeypair = config.facilitatorKeypair;
    this.escrowWallet = config.escrowWallet;
    this.usdcMint = config.usdcMint;
  }
  
  // Verify payment payload
  async verifyPayment(encodedPayment: string): Promise<{
    valid: boolean;
    paymentId?: string;
    payer?: string;
    amount?: string;
    error?: string;
  }> {
    try {
      const payload = parseXPaymentHeader(encodedPayment);
      
      if (!payload) {
        return { valid: false, error: 'Invalid payload format' };
      }
      
      // Check expiry
      if (Date.now() > payload.payload.expiresAt) {
        return { valid: false, error: 'Payment expired' };
      }
      
      // Verify signature
      if (payload.payload.paymentIntentSignature) {
        const isValid = verifySignature(
          payload.payload.paymentIntentSignature.signature,
          payload.payload.paymentId,
          payload.payload.payer
        );
        
        if (!isValid) {
          return { valid: false, error: 'Invalid signature' };
        }
      }
      
      return {
        valid: true,
        paymentId: payload.payload.paymentId,
        payer: payload.payload.payer,
        amount: payload.payload.amount,
      };
    } catch (error) {
      return { valid: false, error: 'Verification failed' };
    }
  }
  
  // Settle payment on Solana
  async settlePayment(encodedPayment: string): Promise<{
    success: boolean;
    txSignature?: string;
    slot?: number;
    error?: string;
  }> {
    try {
      // Verify first
      const verification = await this.verifyPayment(encodedPayment);
      if (!verification.valid) {
        return { success: false, error: verification.error };
      }
      
      const payload = parseXPaymentHeader(encodedPayment)!;
      const payer = new PublicKey(payload.payload.payer);
      const recipient = new PublicKey(payload.payload.recipient);
      const amount = BigInt(payload.payload.amount);
      
      // Get token accounts
      const payerTokenAccount = await getAssociatedTokenAddress(
        this.usdcMint,
        payer
      );
      
      const recipientTokenAccount = await getAssociatedTokenAddress(
        this.usdcMint,
        recipient
      );
      
      // Create transfer instruction
      // Note: In production, this would be a more complex flow
      // with the user's pre-signed transaction
      const transferIx = createTransferInstruction(
        payerTokenAccount,
        recipientTokenAccount,
        payer,  // Authority - needs user signature
        amount
      );
      
      // For demo mode: simulate success
      console.log('Demo mode: Simulating settlement');
      console.log(`Transfer ${amount} from ${payer.toBase58()} to ${recipient.toBase58()}`);
      
      return {
        success: true,
        txSignature: `demo_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        slot: Math.floor(Math.random() * 1000000) + 250000000,
      };
      
    } catch (error) {
      console.error('Settlement error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  // Check payment status on-chain
  async checkPaymentStatus(paymentId: string): Promise<{
    status: 'pending' | 'completed' | 'expired' | 'refunded';
    amount?: string;
    payer?: string;
    recipient?: string;
  }> {
    // In production: query Anchor program for payment state
    // For demo: return mock status
    return {
      status: 'pending',
    };
  }
}
```

---

### 📊 ملخص الفروقات الرئيسية

| الجانب | PayBot (EVM) | SynapsePay (Solana) |
|--------|--------------|---------------------|
| **سرعة المعاملات** | ~15 ثانية | ~400ms ⚡ |
| **تكلفة الغاز** | $0.10-$5+ | ~$0.001 |
| **عدد التوقيعات** | 2 (Permit + Intent) | 1 (Intent فقط) |
| **Token Approval** | EIP-2612 Permit | SPL Delegate/Transfer |
| **نوع التوقيع** | ECDSA (secp256k1) | Ed25519 |

---

### ✅ خطوات التنفيذ المحدثة

```
الترتيب النهائي مع PayBot patterns:

1️⃣  packages/x402-solana/src/client-helpers.ts  ← إضافة جديدة
2️⃣  apps/x402-facilitator/src/facilitator.ts    ← إضافة جديدة
3️⃣  programs/synapsepay-payments/ (Anchor)      ← تحديث
4️⃣  apps/x402-facilitator/src/routes/           ← تحديث
5️⃣  apps/resource-server/                       ← تحديث
6️⃣  apps/web/src/hooks/usePayment.ts           ← نفس pattern من PayBot
7️⃣  apps/web/src/components/payment/           ← نفس pattern من PayBot
```
