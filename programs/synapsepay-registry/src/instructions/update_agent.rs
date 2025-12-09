use anchor_lang::prelude::*;
use crate::state::Agent;
use super::register_agent::RegistryError;

#[derive(Accounts)]
pub struct UpdateAgent<'info> {
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

pub fn handler(
    ctx: Context<UpdateAgent>,
    new_metadata_cid: Option<String>,
    new_price: Option<u64>,
) -> Result<()> {
    let agent = &mut ctx.accounts.agent;
    let clock = Clock::get()?;

    if let Some(metadata_cid) = new_metadata_cid {
        require!(metadata_cid.len() <= Agent::MAX_METADATA_CID_LEN, RegistryError::MetadataCidTooLong);
        agent.metadata_cid = metadata_cid;
    }

    if let Some(price) = new_price {
        require!(price > 0, RegistryError::InvalidPrice);
        agent.price = price;
    }

    agent.updated_at = clock.unix_timestamp;

    msg!("Agent updated: {}", agent.agent_id);
    Ok(())
}
