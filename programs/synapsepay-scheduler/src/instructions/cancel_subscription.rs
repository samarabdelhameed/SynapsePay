use anchor_lang::prelude::*;
use crate::state::Subscription;
use super::create_subscription::SchedulerError;

#[derive(Accounts)]
pub struct CancelSubscription<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        has_one = owner @ SchedulerError::Unauthorized,
        close = owner
    )]
    pub subscription: Account<'info, Subscription>,
}

pub fn handler(ctx: Context<CancelSubscription>) -> Result<()> {
    // TODO: Refund remaining balance to owner
    msg!("Subscription cancelled: {}", ctx.accounts.subscription.subscription_id);
    Ok(())
}
