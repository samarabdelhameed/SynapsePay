use anchor_lang::prelude::*;
use crate::{PaymentState, state::{Payment, Receipt, Invoice}};
use super::create_invoice::PaymentError;

#[derive(Accounts)]
pub struct MintReceipt<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        constraint = payment.payer == payer.key() @ PaymentError::Unauthorized,
        constraint = payment.state == PaymentState::Completed @ PaymentError::InvalidState
    )]
    pub payment: Account<'info, Payment>,

    pub invoice: Account<'info, Invoice>,

    #[account(
        init,
        payer = payer,
        space = Receipt::LEN,
        seeds = [b"receipt", payment.key().as_ref()],
        bump
    )]
    pub receipt: Account<'info, Receipt>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<MintReceipt>) -> Result<()> {
    let payment = &ctx.accounts.payment;
    let invoice = &ctx.accounts.invoice;
    let receipt = &mut ctx.accounts.receipt;
    let clock = Clock::get()?;

    receipt.receipt_id = receipt.key();
    receipt.payment = payment.key();
    receipt.payer = payment.payer;
    receipt.agent_id = invoice.agent_id.clone();
    receipt.amount = payment.amount + payment.platform_fee;
    receipt.result_cid = payment.result_cid.clone();
    receipt.minted_at = clock.unix_timestamp;
    receipt.slot = clock.slot;
    receipt.bump = ctx.bumps.receipt;

    msg!("Receipt minted: {}", receipt.receipt_id);
    Ok(())
}
