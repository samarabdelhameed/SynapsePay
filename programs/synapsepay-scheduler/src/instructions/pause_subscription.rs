use anchor_lang::prelude::*;
use crate::state::Subscription;
use super::create_subscription::SchedulerError;

#[derive(Accounts)]
pub struct PauseSubscription<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        has_one = owner @ SchedulerError::Unauthorized,
    )]
    pub subscription: Account<'info, Subscription>,
}

pub fn handler(ctx: Context<PauseSubscription>) -> Result<()> {
    let subscription = &mut ctx.accounts.subscription;
    subscription.is_paused = true;

    msg!("Subscription paused: {}", subscription.subscription_id);
    Ok(())
}
