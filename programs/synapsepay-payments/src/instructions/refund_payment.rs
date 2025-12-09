use anchor_lang::prelude::*;
use crate::{PaymentState, state::Payment};
use super::create_invoice::PaymentError;

#[derive(Accounts)]
pub struct RefundPayment<'info> {
    pub authority: Signer<'info>,

    #[account(
        mut,
        constraint = payment.state == PaymentState::Failed || payment.state == PaymentState::Executing @ PaymentError::InvalidState
    )]
    pub payment: Account<'info, Payment>,
}

pub fn handler(ctx: Context<RefundPayment>) -> Result<()> {
    let payment = &mut ctx.accounts.payment;

    // TODO: Transfer USDC back to payer

    payment.state = PaymentState::Refunded;

    msg!("Payment refunded: {}", payment.payment_id);
    Ok(())
}
