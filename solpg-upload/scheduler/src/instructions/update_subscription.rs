use anchor_lang::prelude::*;
use crate::{ScheduleCadence, state::Subscription};
use super::create_subscription::SchedulerError;

#[derive(Accounts)]
pub struct UpdateSubscription<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        has_one = owner @ SchedulerError::Unauthorized,
    )]
    pub subscription: Account<'info, Subscription>,
}

pub fn handler(ctx: Context<UpdateSubscription>, new_cadence: ScheduleCadence) -> Result<()> {
    let subscription = &mut ctx.accounts.subscription;
    let clock = Clock::get()?;

    subscription.cadence = new_cadence.clone();
    subscription.next_run_at = clock.unix_timestamp + new_cadence.to_seconds() as i64;

    msg!("Subscription updated: {}", subscription.subscription_id);
    Ok(())
}
