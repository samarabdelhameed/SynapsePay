use anchor_lang::prelude::*;
use crate::AgentCategory;

#[account]
#[derive(Default)]
pub struct Agent {
    /// Agent owner wallet
    pub owner: Pubkey,
    /// Unique identifier
    pub agent_id: String,
    /// IPFS CID for metadata
    pub metadata_cid: String,
    /// Price in USDC (6 decimals)
    pub price: u64,
    /// Agent category
    pub category: AgentCategory,
    /// Total execution count
    pub total_runs: u64,
    /// Total USDC earned
    pub total_earned: u64,
    /// Average rating (0-500, representing 0.0-5.0)
    pub rating: u16,
    /// Number of ratings received
    pub rating_count: u32,
    /// Active status
    pub is_active: bool,
    /// Creation timestamp
    pub created_at: i64,
    /// Last update timestamp
    pub updated_at: i64,
    /// Bump seed for PDA
    pub bump: u8,
}

impl Agent {
    pub const MAX_AGENT_ID_LEN: usize = 32;
    pub const MAX_METADATA_CID_LEN: usize = 64;
    
    pub const LEN: usize = 8 + // discriminator
        32 + // owner
        4 + Self::MAX_AGENT_ID_LEN + // agent_id (string)
        4 + Self::MAX_METADATA_CID_LEN + // metadata_cid (string)
        8 + // price
        1 + // category
        8 + // total_runs
        8 + // total_earned
        2 + // rating
        4 + // rating_count
        1 + // is_active
        8 + // created_at
        8 + // updated_at
        1; // bump
}
