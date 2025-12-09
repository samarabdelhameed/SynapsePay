use anchor_lang::prelude::*;
use crate::PaymentState;

#[account]
#[derive(Default)]
pub struct Invoice {
    /// PDA derived ID
    pub invoice_id: Pubkey,
    /// User wallet
    pub payer: Pubkey,
    /// Agent owner
    pub recipient: Pubkey,
    /// Target agent
    pub agent_id: String,
    /// USDC amount
    pub amount: u64,
    /// Current state
    pub state: PaymentState,
    /// Expiration time
    pub expires_at: i64,
    /// Creation time
    pub created_at: i64,
    /// Replay protection nonce
    pub nonce: u64,
    /// Bump seed
    pub bump: u8,
}

impl Invoice {
    pub const MAX_AGENT_ID_LEN: usize = 32;
    
    pub const LEN: usize = 8 + // discriminator
        32 + // invoice_id
        32 + // payer
        32 + // recipient
        4 + Self::MAX_AGENT_ID_LEN + // agent_id
        8 + // amount
        1 + // state
        8 + // expires_at
        8 + // created_at
        8 + // nonce
        1; // bump
}
