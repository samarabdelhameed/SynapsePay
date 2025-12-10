use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, Mint};

#[derive(Accounts)]
pub struct InitializeScheduler<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    /// Subscription vault authority PDA - signs for subscription vault operations
    /// CHECK: PDA authority
    #[account(
        seeds = [b"subscription_vault_authority"],
        bump,
    )]
    pub vault_authority: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeScheduler>) -> Result<()> {
    msg!("Scheduler initialized successfully");
    msg!("Subscription Vault Authority: {}", ctx.accounts.vault_authority.key());
    Ok(())
}
