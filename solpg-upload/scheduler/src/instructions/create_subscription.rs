use anchor_lang::prelude::*;
use crate::{ScheduleCadence, state::Subscription};

#[derive(Accounts)]
#[instruction(agent_id: String)]
pub struct CreateSubscription<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
        payer = owner,
        space = Subscription::LEN,
        seeds = [b"subscription", owner.key().as_ref(), agent_id.as_bytes()],
        bump
    )]
    pub subscription: Account<'info, Subscription>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CreateSubscription>,
    agent_id: String,
    cadence: ScheduleCadence,
    max_runs: Option<u64>,
) -> Result<()> {
    let subscription = &mut ctx.accounts.subscription;
    let clock = Clock::get()?;

    require!(agent_id.len() <= Subscription::MAX_AGENT_ID_LEN, SchedulerError::AgentIdTooLong);

    let next_run = clock.unix_timestamp + cadence.to_seconds() as i64;

    subscription.subscription_id = subscription.key();
    subscription.owner = ctx.accounts.owner.key();
    subscription.agent_id = agent_id;
    subscription.cadence = cadence;
    subscription.next_run_at = next_run;
    subscription.last_run_at = 0;
    subscription.total_runs = 0;
    subscription.max_runs = max_runs.unwrap_or(0);
    subscription.balance = 0;
    subscription.is_active = true;
    subscription.is_paused = false;
    subscription.created_at = clock.unix_timestamp;
    subscription.bump = ctx.bumps.subscription;

    msg!("Subscription created: {}", subscription.subscription_id);
    Ok(())
}

#[error_code]
pub enum SchedulerError {
    #[msg("Agent ID too long")]
    AgentIdTooLong,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Subscription not active")]
    NotActive,
    #[msg("Subscription is paused")]
    IsPaused,
    #[msg("Insufficient balance")]
    InsufficientBalance,
    #[msg("Not time to run yet")]
    NotTimeYet,
    #[msg("Max runs reached")]
    MaxRunsReached,
}
