use anchor_lang::prelude::*;
use crate::state::Subscription;
use super::create_subscription::SchedulerError;

#[derive(Accounts)]
pub struct TriggerScheduledTask<'info> {
    /// Keeper/Crank that triggers the task
    pub keeper: Signer<'info>,

    #[account(
        mut,
        constraint = subscription.is_active @ SchedulerError::NotActive,
        constraint = !subscription.is_paused @ SchedulerError::IsPaused,
    )]
    pub subscription: Account<'info, Subscription>,
}

pub fn handler(ctx: Context<TriggerScheduledTask>) -> Result<()> {
    let subscription = &mut ctx.accounts.subscription;
    let clock = Clock::get()?;

    // Check if it's time to run
    require!(clock.unix_timestamp >= subscription.next_run_at, SchedulerError::NotTimeYet);

    // Check max runs
    if subscription.max_runs > 0 {
        require!(subscription.total_runs < subscription.max_runs, SchedulerError::MaxRunsReached);
    }

    // Check balance
    // TODO: Get agent price and verify balance

    // Update subscription
    subscription.last_run_at = clock.unix_timestamp;
    subscription.next_run_at = clock.unix_timestamp + subscription.cadence.to_seconds() as i64;
    subscription.total_runs += 1;

    // TODO: Trigger actual agent execution

    msg!("Scheduled task triggered: {}, run #{}", subscription.subscription_id, subscription.total_runs);
    Ok(())
}
