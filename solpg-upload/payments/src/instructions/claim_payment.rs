use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::{PaymentState, state::Payment};
use super::create_invoice::PaymentError;

#[derive(Accounts)]
pub struct ClaimPayment<'info> {
    #[account(mut)]
    pub recipient: Signer<'info>,

    #[account(
        mut,
        constraint = payment.recipient == recipient.key() @ PaymentError::Unauthorized,
        constraint = payment.state == PaymentState::Completed || payment.state == PaymentState::ReceiptMinted @ PaymentError::InvalidState
    )]
    pub payment: Account<'info, Payment>,

    /// Payment escrow account (PDA)
    #[account(
        mut,
        seeds = [b"escrow", payment.key().as_ref()],
        bump,
    )]
    pub escrow_account: Account<'info, TokenAccount>,

    /// Recipient's USDC token account
    #[account(mut)]
    pub recipient_token_account: Account<'info, TokenAccount>,

    /// Escrow authority PDA
    /// CHECK: PDA signer for escrow
    #[account(
        seeds = [b"escrow_authority"],
        bump,
    )]
    pub escrow_authority: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<ClaimPayment>) -> Result<()> {
    let payment = &mut ctx.accounts.payment;
    let amount = payment.amount;

    // Transfer USDC from escrow to recipient
    let seeds = &[
        b"escrow_authority".as_ref(),
        &[ctx.bumps.escrow_authority],
    ];
    let signer_seeds = &[&seeds[..]];

    let cpi_accounts = Transfer {
        from: ctx.accounts.escrow_account.to_account_info(),
        to: ctx.accounts.recipient_token_account.to_account_info(),
        authority: ctx.accounts.escrow_authority.to_account_info(),
    };

    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

    token::transfer(cpi_ctx, amount)?;

    // Update payment state
    payment.state = PaymentState::Claimed;

    msg!("Payment claimed: {} - {} USDC transferred to recipient", payment.payment_id, amount);
    Ok(())
}
