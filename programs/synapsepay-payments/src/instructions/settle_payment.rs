use anchor_lang::prelude::*;
use crate::{PaymentState, state::{Invoice, Payment}};
use super::create_invoice::PaymentError;

#[derive(Accounts)]
pub struct SettlePayment<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        mut,
        constraint = invoice.payer == payer.key() @ PaymentError::Unauthorized,
        constraint = invoice.state == PaymentState::InvoiceCreated @ PaymentError::InvalidState
    )]
    pub invoice: Account<'info, Invoice>,

    #[account(
        init,
        payer = payer,
        space = Payment::LEN,
        seeds = [b"payment", invoice.key().as_ref()],
        bump
    )]
    pub payment: Account<'info, Payment>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<SettlePayment>, signature: [u8; 64]) -> Result<()> {
    let invoice = &mut ctx.accounts.invoice;
    let payment = &mut ctx.accounts.payment;
    let clock = Clock::get()?;

    // Check expiry
    require!(clock.unix_timestamp < invoice.expires_at, PaymentError::InvoiceExpired);

    // Calculate platform fee (5%)
    let platform_fee = invoice.amount / 20;
    let net_amount = invoice.amount - platform_fee;

    // Update invoice state
    invoice.state = PaymentState::Pending;

    // Create payment record
    payment.payment_id = payment.key();
    payment.invoice = invoice.key();
    payment.payer = invoice.payer;
    payment.recipient = invoice.recipient;
    payment.amount = net_amount;
    payment.platform_fee = platform_fee;
    payment.state = PaymentState::Pending;
    payment.tx_signature = signature;
    payment.settled_at = clock.unix_timestamp;
    payment.bump = ctx.bumps.payment;

    msg!("Payment settled: {}", payment.payment_id);
    Ok(())
}
