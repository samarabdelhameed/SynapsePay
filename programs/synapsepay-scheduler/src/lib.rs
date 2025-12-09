use anchor_lang::prelude::*;

pub mod instructions;
pub mod state;

use instructions::*;
use state::*;

declare_id!("SYNScheduler11111111111111111111111111111111");

#[program]
pub mod synapsepay_scheduler {
    use super::*;

    /// Create a new subscription for automated tasks
    pub fn create_subscription(
        ctx: Context<CreateSubscription>,
        agent_id: String,
        cadence: ScheduleCadence,
        max_runs: Option<u64>,
    ) -> Result<()> {
        instructions::create_subscription::handler(ctx, agent_id, cadence, max_runs)
    }

    /// Update subscription cadence
    pub fn update_subscription(
        ctx: Context<UpdateSubscription>,
        new_cadence: ScheduleCadence,
    ) -> Result<()> {
        instructions::update_subscription::handler(ctx, new_cadence)
    }

    /// Pause an active subscription
    pub fn pause_subscription(ctx: Context<PauseSubscription>) -> Result<()> {
        instructions::pause_subscription::handler(ctx)
    }

    /// Resume a paused subscription
    pub fn resume_subscription(ctx: Context<ResumeSubscription>) -> Result<()> {
        instructions::resume_subscription::handler(ctx)
    }

    /// Cancel subscription and refund remaining balance
    pub fn cancel_subscription(ctx: Context<CancelSubscription>) -> Result<()> {
        instructions::cancel_subscription::handler(ctx)
    }

    /// Trigger a scheduled task (called by keeper/crank)
    pub fn trigger_scheduled_task(ctx: Context<TriggerScheduledTask>) -> Result<()> {
        instructions::trigger_scheduled_task::handler(ctx)
    }

    /// Fund subscription with more USDC
    pub fn fund_subscription(ctx: Context<FundSubscription>, amount: u64) -> Result<()> {
        instructions::fund_subscription::handler(ctx, amount)
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum ScheduleCadence {
    Hourly,
    Daily,
    Weekly,
    Monthly,
    Custom { seconds: u64 },
}

impl Default for ScheduleCadence {
    fn default() -> Self {
        ScheduleCadence::Daily
    }
}

impl ScheduleCadence {
    pub fn to_seconds(&self) -> u64 {
        match self {
            ScheduleCadence::Hourly => 3600,
            ScheduleCadence::Daily => 86400,
            ScheduleCadence::Weekly => 604800,
            ScheduleCadence::Monthly => 2592000,
            ScheduleCadence::Custom { seconds } => *seconds,
        }
    }
}
