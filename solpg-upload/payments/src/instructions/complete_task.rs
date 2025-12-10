use anchor_lang::prelude::*;
use crate::{PaymentState, state::Payment};
use super::create_invoice::PaymentError;

#[derive(Accounts)]
pub struct CompleteTask<'info> {
    /// Platform authority or facilitator
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

    payment.result_cid = result_cid.clone();
    payment.state = PaymentState::Completed;

    // Emit event for off-chain indexing
    emit!(TaskCompleted {
        payment_id: payment.payment_id,
        payer: payment.payer,
        recipient: payment.recipient,
        amount: payment.amount,
        result_cid,
        completed_at: Clock::get()?.unix_timestamp,
    });

    msg!("Task completed: {} - result: {}", payment.payment_id, payment.result_cid);
    Ok(())
}

#[event]
pub struct TaskCompleted {
    pub payment_id: Pubkey,
    pub payer: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
    pub result_cid: String,
    pub completed_at: i64,
}

