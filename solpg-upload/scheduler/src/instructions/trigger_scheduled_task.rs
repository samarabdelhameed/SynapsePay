use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::Subscription;
use super::create_subscription::SchedulerError;

#[derive(Accounts)]
pub struct TriggerScheduledTask<'info> {
    /// Keeper/Crank that triggers the task
    pub keeper: Signer<'info>,

    #[account(
        mut,
        constraint = subscription.is_active @ SchedulerError::NotActive,
        constraint = !subscription.is_paused @ SchedulerError::IsPaused,
    )]
    pub subscription: Account<'info, Subscription>,

    /// Agent account to get pricing
    /// CHECK: Agent registry account
    #[account()]
    pub agent: UncheckedAccount<'info>,

    /// Subscription's token account (holds pre-funded USDC)
    #[account(
        mut,
        seeds = [b"subscription_vault", subscription.key().as_ref()],
        bump,
    )]
    pub subscription_vault: Account<'info, TokenAccount>,

    /// Payment escrow for this execution
    #[account(mut)]
    pub payment_escrow: Account<'info, TokenAccount>,

    /// Platform fee treasury
    #[account(
        mut,
        seeds = [b"fee_treasury"],
        bump,
    )]
    pub fee_treasury: Account<'info, TokenAccount>,

    /// Subscription vault authority PDA
    /// CHECK: PDA signer for subscription vault
    #[account(
        seeds = [b"subscription_vault_authority"],
        bump,
    )]
    pub vault_authority: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<TriggerScheduledTask>) -> Result<()> {
    let subscription = &mut ctx.accounts.subscription;
    let clock = Clock::get()?;

    // Check if it's time to run
    require!(clock.unix_timestamp >= subscription.next_run_at, SchedulerError::NotTimeYet);

    // Check max runs
    if subscription.max_runs > 0 {
        require!(subscription.total_runs < subscription.max_runs, SchedulerError::MaxRunsReached);
    }

    // Get agent price from agent account
    // For now, we'll use a fixed price or read from agent metadata
    // In production, this would deserialize the Agent account
    let agent_price: u64 = 1_000_000; // 1 USDC (6 decimals) - placeholder
    
    // Calculate platform fee (5%)
    let platform_fee = agent_price / 20;
    let total_cost = agent_price + platform_fee;

    // Check subscription balance
    require!(subscription.balance >= total_cost, SchedulerError::InsufficientBalance);

    // Deduct from subscription balance
    subscription.balance -= total_cost;

    // Transfer agent payment to escrow
    let seeds = &[
        b"subscription_vault_authority".as_ref(),
        &[ctx.bumps.vault_authority],
    ];
    let signer_seeds = &[&seeds[..]];

    let cpi_accounts_payment = Transfer {
        from: ctx.accounts.subscription_vault.to_account_info(),
        to: ctx.accounts.payment_escrow.to_account_info(),
        authority: ctx.accounts.vault_authority.to_account_info(),
    };

    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx_payment = CpiContext::new_with_signer(cpi_program.clone(), cpi_accounts_payment, signer_seeds);

    token::transfer(cpi_ctx_payment, agent_price)?;

    // Transfer platform fee to treasury
    let cpi_accounts_fee = Transfer {
        from: ctx.accounts.subscription_vault.to_account_info(),
        to: ctx.accounts.fee_treasury.to_account_info(),
        authority: ctx.accounts.vault_authority.to_account_info(),
    };

    let cpi_ctx_fee = CpiContext::new_with_signer(cpi_program, cpi_accounts_fee, signer_seeds);
    token::transfer(cpi_ctx_fee, platform_fee)?;

    // Update subscription
    subscription.last_run_at = clock.unix_timestamp;
    subscription.next_run_at = clock.unix_timestamp + subscription.cadence.to_seconds() as i64;
    subscription.total_runs += 1;

    // Emit event for off-chain agent execution
    emit!(ScheduledTaskTriggered {
        subscription_id: subscription.subscription_id,
        agent_id: subscription.agent_id.clone(),
        run_number: subscription.total_runs,
        timestamp: clock.unix_timestamp,
        amount_paid: agent_price,
    });

    msg!("Scheduled task triggered: {}, run #{}, paid {} USDC", 
        subscription.subscription_id, 
        subscription.total_runs,
        agent_price
    );
    
    Ok(())
}

#[event]
pub struct ScheduledTaskTriggered {
    pub subscription_id: Pubkey,
    pub agent_id: String,
    pub run_number: u64,
    pub timestamp: i64,
    pub amount_paid: u64,
}
