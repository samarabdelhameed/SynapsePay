use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, Transfer};

pub mod instructions;
pub mod state;

use instructions::*;
use state::*;

declare_id!("8yzR2Ze7t8NjH9b9wUUaUxkHLcrfogWqAzqbMSb1vZgP");

#[program]
pub mod synapsepay_payments {
    use super::*;

    /// Initialize platform with fee treasury and authorities
    pub fn initialize_platform(ctx: Context<InitializePlatform>) -> Result<()> {
        instructions::initialize_platform::handler(ctx)
    }

    /// Create a new payment invoice
    pub fn create_invoice(
        ctx: Context<CreateInvoice>,
        agent_id: String,
        amount: u64,
        expires_at: i64,
    ) -> Result<()> {
        instructions::create_invoice::handler(ctx, agent_id, amount, expires_at)
    }

    /// Settle a payment after user signature
    pub fn settle_payment(
        ctx: Context<SettlePayment>,
        signature: [u8; 64],
    ) -> Result<()> {
        instructions::settle_payment::handler(ctx, signature)
    }

    /// Verify payment signature and transfer to escrow
    pub fn verify_payment(ctx: Context<VerifyPayment>) -> Result<()> {
        instructions::verify_payment::handler(ctx)
    }

    /// Complete task and store result CID
    pub fn complete_task(
        ctx: Context<CompleteTask>,
        result_cid: String,
    ) -> Result<()> {
        instructions::complete_task::handler(ctx, result_cid)
    }

    /// Mint an on-chain receipt NFT
    pub fn mint_receipt(ctx: Context<MintReceipt>) -> Result<()> {
        instructions::mint_receipt::handler(ctx)
    }

    /// Claim payment as agent owner
    pub fn claim_payment(ctx: Context<ClaimPayment>) -> Result<()> {
        instructions::claim_payment::handler(ctx)
    }

    /// Refund payment to payer
    pub fn refund_payment(ctx: Context<RefundPayment>) -> Result<()> {
        instructions::refund_payment::handler(ctx)
    }

    /// Withdraw accumulated platform fees
    pub fn withdraw_fees(ctx: Context<WithdrawFees>) -> Result<()> {
        instructions::withdraw_fees::handler(ctx)
    }
}


#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum PaymentState {
    InvoiceCreated,
    Pending,
    Executing,
    Completed,
    ReceiptMinted,
    Claimed,
    Expired,
    Failed,
    Refunded,
}

impl Default for PaymentState {
    fn default() -> Self {
        PaymentState::InvoiceCreated
    }
}
