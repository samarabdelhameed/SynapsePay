use anchor_lang::prelude::*;
use crate::{PaymentState, state::Payment};
use super::create_invoice::PaymentError;

#[derive(Accounts)]
pub struct VerifyPayment<'info> {
    pub authority: Signer<'info>,

    #[account(
        mut,
        constraint = payment.state == PaymentState::Pending @ PaymentError::InvalidState
    )]
    pub payment: Account<'info, Payment>,
}

pub fn handler(ctx: Context<VerifyPayment>) -> Result<()> {
    let payment = &mut ctx.accounts.payment;

    // TODO: Verify Ed25519 signature
    // For now, just update state

    payment.state = PaymentState::Executing;

    msg!("Payment verified, executing: {}", payment.payment_id);
    Ok(())
}
