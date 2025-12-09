use anchor_lang::prelude::*;
use crate::state::Subscription;
use super::create_subscription::SchedulerError;

#[derive(Accounts)]
pub struct FundSubscription<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        has_one = owner @ SchedulerError::Unauthorized,
    )]
    pub subscription: Account<'info, Subscription>,

    // TODO: Add USDC token accounts for transfer
}

pub fn handler(ctx: Context<FundSubscription>, amount: u64) -> Result<()> {
    let subscription = &mut ctx.accounts.subscription;

    // TODO: Transfer USDC from owner to subscription escrow

    subscription.balance += amount;

    msg!("Subscription funded: {}, new balance: {}", subscription.subscription_id, subscription.balance);
    Ok(())
}
