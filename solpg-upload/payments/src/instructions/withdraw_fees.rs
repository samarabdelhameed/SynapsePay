use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

#[derive(Accounts)]
pub struct WithdrawFees<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    /// Platform fee treasury account (PDA)
    #[account(
        mut,
        seeds = [b"fee_treasury"],
        bump,
    )]
    pub fee_treasury: Account<'info, TokenAccount>,

    /// Admin's USDC token account
    #[account(mut)]
    pub admin_token_account: Account<'info, TokenAccount>,

    /// Platform authority PDA
    /// CHECK: PDA signer for fee treasury
    #[account(
        seeds = [b"platform_authority"],
        bump,
    )]
    pub platform_authority: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<WithdrawFees>) -> Result<()> {
    let fee_treasury = &ctx.accounts.fee_treasury;
    let amount = fee_treasury.amount;

    require!(amount > 0, FeeError::NoFeesToWithdraw);

    // Transfer all accumulated fees to admin
    let seeds = &[
        b"platform_authority".as_ref(),
        &[ctx.bumps.platform_authority],
    ];
    let signer_seeds = &[&seeds[..]];

    let cpi_accounts = Transfer {
        from: ctx.accounts.fee_treasury.to_account_info(),
        to: ctx.accounts.admin_token_account.to_account_info(),
        authority: ctx.accounts.platform_authority.to_account_info(),
    };

    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

    token::transfer(cpi_ctx, amount)?;

    msg!("Fees withdrawn: {} USDC to admin", amount);
    Ok(())
}

#[error_code]
pub enum FeeError {
    #[msg("No fees available to withdraw")]
    NoFeesToWithdraw,
}
