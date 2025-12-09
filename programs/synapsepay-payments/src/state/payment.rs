use anchor_lang::prelude::*;
use crate::PaymentState;

#[account]
#[derive(Default)]
pub struct Payment {
    /// PDA derived ID
    pub payment_id: Pubkey,
    /// Related invoice
    pub invoice: Pubkey,
    /// User wallet
    pub payer: Pubkey,
    /// Agent owner
    pub recipient: Pubkey,
    /// USDC amount
    pub amount: u64,
    /// Platform fee (5%)
    pub platform_fee: u64,
    /// Current state
    pub state: PaymentState,
    /// IPFS result CID
    pub result_cid: String,
    /// Solana tx signature
    pub tx_signature: [u8; 64],
    /// Settlement time
    pub settled_at: i64,
    /// Bump seed
    pub bump: u8,
}

impl Payment {
    pub const MAX_RESULT_CID_LEN: usize = 64;
    
    pub const LEN: usize = 8 + // discriminator
        32 + // payment_id
        32 + // invoice
        32 + // payer
        32 + // recipient
        8 + // amount
        8 + // platform_fee
        1 + // state
        4 + Self::MAX_RESULT_CID_LEN + // result_cid
        64 + // tx_signature
        8 + // settled_at
        1; // bump
}
