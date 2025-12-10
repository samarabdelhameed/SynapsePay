use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::Subscription;
use super::create_subscription::SchedulerError;

#[derive(Accounts)]
pub struct FundSubscription<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        constraint = subscription.owner == owner.key() @ SchedulerError::Unauthorized
    )]
    pub subscription: Account<'info, Subscription>,

    /// Owner's USDC token account
    #[account(mut)]
    pub owner_token_account: Account<'info, TokenAccount>,

    /// Subscription's token vault (holds pre-funded USDC)
    #[account(
        mut,
        seeds = [b"subscription_vault", subscription.key().as_ref()],
        bump,
    )]
    pub subscription_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<FundSubscription>, amount: u64) -> Result<()> {
    let subscription = &mut ctx.accounts.subscription;

    require!(amount > 0, SchedulerError::InsufficientBalance);

    // Transfer USDC from owner to subscription vault
    let cpi_accounts = Transfer {
        from: ctx.accounts.owner_token_account.to_account_info(),
        to: ctx.accounts.subscription_vault.to_account_info(),
        authority: ctx.accounts.owner.to_account_info(),
    };

    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

    token::transfer(cpi_ctx, amount)?;

    // Update subscription balance
    subscription.balance += amount;

    msg!("Subscription funded: {} - added {} USDC (new balance: {})",
        subscription.subscription_id,
        amount,
        subscription.balance
    );

    Ok(())
}
