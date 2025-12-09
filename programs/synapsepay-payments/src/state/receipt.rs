use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct Receipt {
    /// PDA derived ID
    pub receipt_id: Pubkey,
    /// Related payment
    pub payment: Pubkey,
    /// User wallet
    pub payer: Pubkey,
    /// Agent executed
    pub agent_id: String,
    /// Amount paid
    pub amount: u64,
    /// IPFS result
    pub result_cid: String,
    /// Mint time
    pub minted_at: i64,
    /// Solana slot
    pub slot: u64,
    /// Bump seed
    pub bump: u8,
}

impl Receipt {
    pub const MAX_AGENT_ID_LEN: usize = 32;
    pub const MAX_RESULT_CID_LEN: usize = 64;
    
    pub const LEN: usize = 8 + // discriminator
        32 + // receipt_id
        32 + // payment
        32 + // payer
        4 + Self::MAX_AGENT_ID_LEN + // agent_id
        8 + // amount
        4 + Self::MAX_RESULT_CID_LEN + // result_cid
        8 + // minted_at
        8 + // slot
        1; // bump
}
