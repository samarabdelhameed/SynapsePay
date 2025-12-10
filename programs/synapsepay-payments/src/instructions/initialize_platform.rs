use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, Mint};

#[derive(Accounts)]
pub struct InitializePlatform<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    /// Platform authority PDA - signs for platform operations
    /// CHECK: PDA authority
    #[account(
        seeds = [b"platform_authority"],
        bump,
    )]
    pub platform_authority: UncheckedAccount<'info>,

    /// Escrow authority PDA - signs for escrow operations
    /// CHECK: PDA authority
    #[account(
        seeds = [b"escrow_authority"],
        bump,
    )]
    pub escrow_authority: UncheckedAccount<'info>,

    /// USDC mint
    pub usdc_mint: Account<'info, Mint>,

    /// Platform fee treasury token account
    #[account(
        init,
        payer = admin,
        seeds = [b"fee_treasury"],
        bump,
        token::mint = usdc_mint,
        token::authority = platform_authority,
    )]
    pub fee_treasury: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<InitializePlatform>) -> Result<()> {
    msg!("Platform initialized successfully");
    msg!("Platform Authority: {}", ctx.accounts.platform_authority.key());
    msg!("Escrow Authority: {}", ctx.accounts.escrow_authority.key());
    msg!("Fee Treasury: {}", ctx.accounts.fee_treasury.key());
    Ok(())
}
