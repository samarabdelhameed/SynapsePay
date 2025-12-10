use anchor_lang::prelude::*;
use crate::ScheduleCadence;

#[account]
#[derive(Default)]
pub struct Subscription {
    /// PDA derived ID
    pub subscription_id: Pubkey,
    /// Subscriber wallet
    pub owner: Pubkey,
    /// Target agent
    pub agent_id: String,
    /// Frequency
    pub cadence: ScheduleCadence,
    /// Next execution time
    pub next_run_at: i64,
    /// Last execution
    pub last_run_at: i64,
    /// Completed runs
    pub total_runs: u64,
    /// Max runs limit (0 = unlimited)
    pub max_runs: u64,
    /// Pre-funded USDC balance
    pub balance: u64,
    /// Active status
    pub is_active: bool,
    /// Paused status
    pub is_paused: bool,
    /// Creation time
    pub created_at: i64,
    /// Bump seed
    pub bump: u8,
}

impl Subscription {
    pub const MAX_AGENT_ID_LEN: usize = 32;
    
    pub const LEN: usize = 8 + // discriminator
        32 + // subscription_id
        32 + // owner
        4 + Self::MAX_AGENT_ID_LEN + // agent_id
        1 + 8 + // cadence (enum + optional u64)
        8 + // next_run_at
        8 + // last_run_at
        8 + // total_runs
        8 + // max_runs
        8 + // balance
        1 + // is_active
        1 + // is_paused
        8 + // created_at
        1; // bump
}
