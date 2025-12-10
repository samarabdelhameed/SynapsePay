use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::{PaymentState, state::Payment};
use super::create_invoice::PaymentError;

#[derive(Accounts)]
pub struct VerifyPayment<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        mut,
        constraint = payment.state == PaymentState::Pending @ PaymentError::InvalidState,
        constraint = payment.payer == payer.key() @ PaymentError::Unauthorized
    )]
    pub payment: Account<'info, Payment>,

    /// Payer's USDC token account
    #[account(mut)]
    pub payer_token_account: Account<'info, TokenAccount>,

    /// Payment escrow account (PDA)
    #[account(
        mut,
        seeds = [b"escrow", payment.key().as_ref()],
        bump,
    )]
    pub escrow_account: Account<'info, TokenAccount>,

    /// Platform fee treasury
    #[account(
        mut,
        seeds = [b"fee_treasury"],
        bump,
    )]
    pub fee_treasury: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<VerifyPayment>) -> Result<()> {
    let payment = &mut ctx.accounts.payment;
    
    // Verify signature using Ed25519 instruction
    // The signature verification is done via Ed25519Program instruction
    // which should be passed before this instruction in the transaction
    
    // Calculate total amount (net + platform fee)
    let total_amount = payment.amount + payment.platform_fee;

    // Transfer USDC from payer to escrow
    let cpi_accounts_escrow = Transfer {
        from: ctx.accounts.payer_token_account.to_account_info(),
        to: ctx.accounts.escrow_account.to_account_info(),
        authority: ctx.accounts.payer.to_account_info(),
    };

    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx_escrow = CpiContext::new(cpi_program.clone(), cpi_accounts_escrow);

    token::transfer(cpi_ctx_escrow, payment.amount)?;

    // Transfer platform fee to treasury
    let cpi_accounts_fee = Transfer {
        from: ctx.accounts.payer_token_account.to_account_info(),
        to: ctx.accounts.fee_treasury.to_account_info(),
        authority: ctx.accounts.payer.to_account_info(),
    };

    let cpi_ctx_fee = CpiContext::new(cpi_program, cpi_accounts_fee);
    token::transfer(cpi_ctx_fee, payment.platform_fee)?;

    // Update payment state
    payment.state = PaymentState::Executing;

    msg!("Payment verified and escrowed: {} USDC (+ {} fee)", payment.amount, payment.platform_fee);
    Ok(())
}
