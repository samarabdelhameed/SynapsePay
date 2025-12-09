use anchor_lang::prelude::*;
use crate::{PaymentState, state::Payment};
use super::create_invoice::PaymentError;

#[derive(Accounts)]
pub struct CompleteTask<'info> {
    pub authority: Signer<'info>,

    #[account(
        mut,
        constraint = payment.state == PaymentState::Executing @ PaymentError::InvalidState
    )]
    pub payment: Account<'info, Payment>,
}

pub fn handler(ctx: Context<CompleteTask>, result_cid: String) -> Result<()> {
    let payment = &mut ctx.accounts.payment;

    require!(result_cid.len() <= Payment::MAX_RESULT_CID_LEN, PaymentError::AgentIdTooLong);

    payment.result_cid = result_cid;
    payment.state = PaymentState::Completed;

    msg!("Task completed: {}", payment.payment_id);
    Ok(())
}
