use anchor_lang::prelude::*;
use crate::state::Subscription;
use super::create_subscription::SchedulerError;

#[derive(Accounts)]
pub struct ResumeSubscription<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        has_one = owner @ SchedulerError::Unauthorized,
    )]
    pub subscription: Account<'info, Subscription>,
}

pub fn handler(ctx: Context<ResumeSubscription>) -> Result<()> {
    let subscription = &mut ctx.accounts.subscription;
    let clock = Clock::get()?;

    subscription.is_paused = false;
    subscription.next_run_at = clock.unix_timestamp + subscription.cadence.to_seconds() as i64;

    msg!("Subscription resumed: {}", subscription.subscription_id);
    Ok(())
}
