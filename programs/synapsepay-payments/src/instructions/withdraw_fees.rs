use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct WithdrawFees<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    // TODO: Add fee treasury account
}

pub fn handler(_ctx: Context<WithdrawFees>) -> Result<()> {
    // TODO: Implement fee withdrawal to admin
    msg!("Fees withdrawn");
    Ok(())
}
