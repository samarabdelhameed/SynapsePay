use anchor_lang::prelude::*;
use crate::{PaymentState, state::Payment};
use super::create_invoice::PaymentError;

#[derive(Accounts)]
pub struct ClaimPayment<'info> {
    #[account(mut)]
    pub recipient: Signer<'info>,

    #[account(
        mut,
        constraint = payment.recipient == recipient.key() @ PaymentError::Unauthorized,
        constraint = payment.state == PaymentState::Completed || payment.state == PaymentState::ReceiptMinted @ PaymentError::InvalidState
    )]
    pub payment: Account<'info, Payment>,
}

pub fn handler(ctx: Context<ClaimPayment>) -> Result<()> {
    let payment = &mut ctx.accounts.payment;

    // TODO: Transfer USDC to recipient

    payment.state = PaymentState::Claimed;

    msg!("Payment claimed: {}", payment.payment_id);
    Ok(())
}
