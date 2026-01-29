use anchor_lang::prelude::*;

declare_id!("YourProgramIdHere");

#[program]
pub mod silentswap_payroll {
    use super::*;

    /// Initialize a payroll batch
    /// This is a placeholder for future on-chain payroll management
    pub fn initialize_payroll(ctx: Context<InitializePayroll>, batch_id: String) -> Result<()> {
        let payroll = &mut ctx.accounts.payroll;
        payroll.authority = ctx.accounts.authority.key();
        payroll.batch_id = batch_id;
        payroll.created_at = Clock::get()?.unix_timestamp;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(batch_id: String)]
pub struct InitializePayroll<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 4 + batch_id.len() + 8,
        seeds = [b"payroll", batch_id.as_bytes()],
        bump
    )]
    pub payroll: Account<'info, PayrollData>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[account]
pub struct PayrollData {
    pub authority: Pubkey,
    pub batch_id: String,
    pub created_at: i64,
}
