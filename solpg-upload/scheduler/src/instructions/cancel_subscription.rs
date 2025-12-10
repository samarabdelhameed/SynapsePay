use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::Subscription;
use super::create_subscription::SchedulerError;

#[derive(Accounts)]
pub struct CancelSubscription<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        constraint = subscription.owner == owner.key() @ SchedulerError::Unauthorized,
        close = owner
    )]
    pub subscription: Account<'info, Subscription>,

    /// Owner's USDC token account (for refund)
    #[account(mut)]
    pub owner_token_account: Account<'info, TokenAccount>,

    /// Subscription's token vault
    #[account(
        mut,
        seeds = [b"subscription_vault", subscription.key().as_ref()],
        bump,
    )]
    pub subscription_vault: Account<'info, TokenAccount>,

    /// Subscription vault authority PDA
    /// CHECK: PDA signer for subscription vault
    #[account(
        seeds = [b"subscription_vault_authority"],
        bump,
    )]
    pub vault_authority: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<CancelSubscription>) -> Result<()> {
    let subscription = &ctx.accounts.subscription;
    let remaining_balance = subscription.balance;

    // Refund remaining balance if any
    if remaining_balance > 0 {
        let seeds = &[
            b"subscription_vault_authority".as_ref(),
            &[ctx.bumps.vault_authority],
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.subscription_vault.to_account_info(),
            to: ctx.accounts.owner_token_account.to_account_info(),
            authority: ctx.accounts.vault_authority.to_account_info(),
        };

        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

        token::transfer(cpi_ctx, remaining_balance)?;

        msg!("Refunded {} USDC to owner", remaining_balance);
    }

    msg!("Subscription cancelled: {}", subscription.subscription_id);
    Ok(())
}
