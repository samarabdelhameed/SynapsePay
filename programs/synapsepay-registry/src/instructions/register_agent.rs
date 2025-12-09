use anchor_lang::prelude::*;
use crate::{AgentCategory, state::Agent};

#[derive(Accounts)]
#[instruction(agent_id: String)]
pub struct RegisterAgent<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
        payer = owner,
        space = Agent::LEN,
        seeds = [b"agent", agent_id.as_bytes()],
        bump
    )]
    pub agent: Account<'info, Agent>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<RegisterAgent>,
    agent_id: String,
    metadata_cid: String,
    price: u64,
    category: AgentCategory,
) -> Result<()> {
    require!(agent_id.len() <= Agent::MAX_AGENT_ID_LEN, RegistryError::AgentIdTooLong);
    require!(metadata_cid.len() <= Agent::MAX_METADATA_CID_LEN, RegistryError::MetadataCidTooLong);
    require!(price > 0, RegistryError::InvalidPrice);

    let agent = &mut ctx.accounts.agent;
    let clock = Clock::get()?;

    agent.owner = ctx.accounts.owner.key();
    agent.agent_id = agent_id;
    agent.metadata_cid = metadata_cid;
    agent.price = price;
    agent.category = category;
    agent.total_runs = 0;
    agent.total_earned = 0;
    agent.rating = 0;
    agent.rating_count = 0;
    agent.is_active = true;
    agent.created_at = clock.unix_timestamp;
    agent.updated_at = clock.unix_timestamp;
    agent.bump = ctx.bumps.agent;

    msg!("Agent registered: {}", agent.agent_id);
    Ok(())
}

#[error_code]
pub enum RegistryError {
    #[msg("Agent ID is too long")]
    AgentIdTooLong,
    #[msg("Metadata CID is too long")]
    MetadataCidTooLong,
    #[msg("Invalid price")]
    InvalidPrice,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Agent is not active")]
    AgentNotActive,
}
