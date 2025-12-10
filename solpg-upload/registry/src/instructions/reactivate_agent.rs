use anchor_lang::prelude::*;
use crate::state::Agent;
use super::register_agent::RegistryError;

#[derive(Accounts)]
pub struct ReactivateAgent<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        has_one = owner @ RegistryError::Unauthorized,
        seeds = [b"agent", agent.agent_id.as_bytes()],
        bump = agent.bump
    )]
    pub agent: Account<'info, Agent>,
}

pub fn handler(ctx: Context<ReactivateAgent>) -> Result<()> {
    let agent = &mut ctx.accounts.agent;
    let clock = Clock::get()?;

    agent.is_active = true;
    agent.updated_at = clock.unix_timestamp;

    msg!("Agent reactivated: {}", agent.agent_id);
    Ok(())
}
