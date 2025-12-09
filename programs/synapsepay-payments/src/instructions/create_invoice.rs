use anchor_lang::prelude::*;
use crate::{PaymentState, state::Invoice};

#[derive(Accounts)]
#[instruction(agent_id: String)]
pub struct CreateInvoice<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: Agent owner's wallet
    pub recipient: UncheckedAccount<'info>,

    #[account(
        init,
        payer = payer,
        space = Invoice::LEN,
        seeds = [b"invoice", payer.key().as_ref(), agent_id.as_bytes(), &Clock::get()?.unix_timestamp.to_le_bytes()],
        bump
    )]
    pub invoice: Account<'info, Invoice>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CreateInvoice>,
    agent_id: String,
    amount: u64,
    expires_at: i64,
) -> Result<()> {
    let invoice = &mut ctx.accounts.invoice;
    let clock = Clock::get()?;

    require!(amount > 0, PaymentError::InvalidAmount);
    require!(expires_at > clock.unix_timestamp, PaymentError::InvalidExpiry);
    require!(agent_id.len() <= Invoice::MAX_AGENT_ID_LEN, PaymentError::AgentIdTooLong);

    invoice.invoice_id = invoice.key();
    invoice.payer = ctx.accounts.payer.key();
    invoice.recipient = ctx.accounts.recipient.key();
    invoice.agent_id = agent_id;
    invoice.amount = amount;
    invoice.state = PaymentState::InvoiceCreated;
    invoice.expires_at = expires_at;
    invoice.created_at = clock.unix_timestamp;
    invoice.nonce = clock.unix_timestamp as u64;
    invoice.bump = ctx.bumps.invoice;

    msg!("Invoice created: {}", invoice.invoice_id);
    Ok(())
}

#[error_code]
pub enum PaymentError {
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Invalid expiry time")]
    InvalidExpiry,
    #[msg("Agent ID too long")]
    AgentIdTooLong,
    #[msg("Invoice expired")]
    InvoiceExpired,
    #[msg("Invalid payment state")]
    InvalidState,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Invalid signature")]
    InvalidSignature,
    #[msg("Nonce already used")]
    NonceAlreadyUsed,
}
