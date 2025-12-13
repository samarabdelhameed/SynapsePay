use anchor_lang::prelude::*;

pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("5w8vTt1AUo67nE9bWA5e9Sh28HXtJJZaqiPj53n6wcby");

#[program]
pub mod synapsepay_registry {
    use super::*;

    /// Register a new AI agent in the marketplace
    pub fn register_agent(
        ctx: Context<RegisterAgent>,
        agent_id: String,
        metadata_cid: String,
        price: u64,
        category: AgentCategory,
    ) -> Result<()> {
        instructions::register_agent::handler(ctx, agent_id, metadata_cid, price, category)
    }

    /// Update an existing agent's metadata and price
    pub fn update_agent(
        ctx: Context<UpdateAgent>,
        new_metadata_cid: Option<String>,
        new_price: Option<u64>,
    ) -> Result<()> {
        instructions::update_agent::handler(ctx, new_metadata_cid, new_price)
    }

    /// Deactivate an agent (remove from marketplace)
    pub fn deactivate_agent(ctx: Context<DeactivateAgent>) -> Result<()> {
        instructions::deactivate_agent::handler(ctx)
    }

    /// Reactivate a previously deactivated agent
    pub fn reactivate_agent(ctx: Context<ReactivateAgent>) -> Result<()> {
        instructions::reactivate_agent::handler(ctx)
    }

    /// Transfer agent ownership to another wallet
    pub fn transfer_ownership(ctx: Context<TransferOwnership>, new_owner: Pubkey) -> Result<()> {
        instructions::transfer_ownership::handler(ctx, new_owner)
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum AgentCategory {
    AI,
    IoT,
    Automation,
    Utility,
    Trading,
    NFT,
}

impl Default for AgentCategory {
    fn default() -> Self {
        AgentCategory::AI
    }
}
