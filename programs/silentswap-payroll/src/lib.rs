use anchor_lang::prelude::*;

declare_id!("4GrNpDUsk5k7NfywagMcfypX9MGAHD6BAJ48PhZtMeUK");

/// Maximum length for string fields
pub const MAX_NAME_LENGTH: usize = 64;
pub const MAX_ROLE_LENGTH: usize = 32;
pub const MAX_ORDER_ID_LENGTH: usize = 128;

#[program]
pub mod silentswap_payroll {
    use super::*;

    /// Initialize an employer account
    pub fn initialize_employer(ctx: Context<InitializeEmployer>, name: String) -> Result<()> {
        require!(name.len() <= MAX_NAME_LENGTH, PayrollError::NameTooLong);
        
        let employer = &mut ctx.accounts.employer;
        employer.owner = ctx.accounts.owner.key();
        employer.name = name;
        employer.recipient_count = 0;
        employer.payment_count = 0;
        employer.created_at = Clock::get()?.unix_timestamp;
        employer.bump = ctx.bumps.employer;
        
        msg!("Employer account created: {}", employer.name);
        Ok(())
    }

    /// Add a new recipient to the employer's payroll
    pub fn add_recipient(
        ctx: Context<AddRecipient>,
        name: String,
        role: String,
    ) -> Result<()> {
        require!(name.len() <= MAX_NAME_LENGTH, PayrollError::NameTooLong);
        require!(role.len() <= MAX_ROLE_LENGTH, PayrollError::RoleTooLong);
        
        let recipient = &mut ctx.accounts.recipient;
        recipient.employer = ctx.accounts.employer.key();
        recipient.wallet = ctx.accounts.wallet.key();
        recipient.name = name;
        recipient.role = role;
        recipient.is_active = true;
        recipient.created_at = Clock::get()?.unix_timestamp;
        recipient.bump = ctx.bumps.recipient;
        
        // Increment employer's recipient count
        let employer = &mut ctx.accounts.employer;
        employer.recipient_count = employer.recipient_count.checked_add(1).unwrap();
        
        msg!("Recipient added: {} ({})", recipient.name, recipient.wallet);
        Ok(())
    }

    /// Update recipient details
    pub fn update_recipient(
        ctx: Context<UpdateRecipient>,
        name: Option<String>,
        role: Option<String>,
    ) -> Result<()> {
        let recipient = &mut ctx.accounts.recipient;
        
        if let Some(new_name) = name {
            require!(new_name.len() <= MAX_NAME_LENGTH, PayrollError::NameTooLong);
            recipient.name = new_name;
        }
        
        if let Some(new_role) = role {
            require!(new_role.len() <= MAX_ROLE_LENGTH, PayrollError::RoleTooLong);
            recipient.role = new_role;
        }
        
        msg!("Recipient updated: {}", recipient.name);
        Ok(())
    }

    /// Deactivate a recipient (soft delete)
    pub fn deactivate_recipient(ctx: Context<UpdateRecipient>) -> Result<()> {
        let recipient = &mut ctx.accounts.recipient;
        recipient.is_active = false;
        
        msg!("Recipient deactivated: {}", recipient.name);
        Ok(())
    }

    /// Reactivate a recipient
    pub fn reactivate_recipient(ctx: Context<UpdateRecipient>) -> Result<()> {
        let recipient = &mut ctx.accounts.recipient;
        recipient.is_active = true;
        
        msg!("Recipient reactivated: {}", recipient.name);
        Ok(())
    }

    /// Create a payment record (when initiating a SilentSwap payment)
    /// NOTE: Amount is NOT stored for privacy
    pub fn create_payment_record(
        ctx: Context<CreatePaymentRecord>,
        silentswap_order_id: String,
    ) -> Result<()> {
        require!(
            silentswap_order_id.len() <= MAX_ORDER_ID_LENGTH,
            PayrollError::OrderIdTooLong
        );
        
        let payment = &mut ctx.accounts.payment_record;
        payment.employer = ctx.accounts.employer.key();
        payment.recipient = ctx.accounts.recipient.key();
        payment.recipient_wallet = ctx.accounts.recipient.wallet;
        payment.status = PaymentStatus::Pending;
        payment.silentswap_order_id = silentswap_order_id;
        payment.created_at = Clock::get()?.unix_timestamp;
        payment.updated_at = payment.created_at;
        payment.bump = ctx.bumps.payment_record;
        
        // Increment employer's payment count
        let employer = &mut ctx.accounts.employer;
        employer.payment_count = employer.payment_count.checked_add(1).unwrap();
        
        msg!("Payment record created for recipient: {}", ctx.accounts.recipient.name);
        Ok(())
    }

    /// Update payment status to completed
    pub fn mark_payment_completed(ctx: Context<UpdatePaymentRecord>) -> Result<()> {
        let payment = &mut ctx.accounts.payment_record;
        require!(
            payment.status == PaymentStatus::Pending,
            PayrollError::InvalidPaymentStatus
        );
        
        payment.status = PaymentStatus::Completed;
        payment.updated_at = Clock::get()?.unix_timestamp;
        
        msg!("Payment marked as completed");
        Ok(())
    }

    /// Update payment status to failed
    pub fn mark_payment_failed(ctx: Context<UpdatePaymentRecord>) -> Result<()> {
        let payment = &mut ctx.accounts.payment_record;
        require!(
            payment.status == PaymentStatus::Pending,
            PayrollError::InvalidPaymentStatus
        );
        
        payment.status = PaymentStatus::Failed;
        payment.updated_at = Clock::get()?.unix_timestamp;
        
        msg!("Payment marked as failed");
        Ok(())
    }
}

// ============================================================================
// ACCOUNTS
// ============================================================================

#[derive(Accounts)]
#[instruction(name: String)]
pub struct InitializeEmployer<'info> {
    #[account(
        init,
        payer = owner,
        space = Employer::space(&name),
        seeds = [b"employer", owner.key().as_ref()],
        bump
    )]
    pub employer: Account<'info, Employer>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(name: String, role: String)]
pub struct AddRecipient<'info> {
    #[account(
        init,
        payer = owner,
        space = Recipient::space(&name, &role),
        seeds = [b"recipient", employer.key().as_ref(), wallet.key().as_ref()],
        bump
    )]
    pub recipient: Account<'info, Recipient>,
    
    #[account(
        mut,
        seeds = [b"employer", owner.key().as_ref()],
        bump = employer.bump,
        has_one = owner
    )]
    pub employer: Account<'info, Employer>,
    
    /// The wallet address of the recipient (for PDA derivation)
    /// CHECK: This is just used for PDA seeds, not accessed
    pub wallet: UncheckedAccount<'info>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateRecipient<'info> {
    #[account(
        mut,
        seeds = [b"recipient", employer.key().as_ref(), recipient.wallet.as_ref()],
        bump = recipient.bump,
        has_one = employer
    )]
    pub recipient: Account<'info, Recipient>,
    
    #[account(
        seeds = [b"employer", owner.key().as_ref()],
        bump = employer.bump,
        has_one = owner
    )]
    pub employer: Account<'info, Employer>,
    
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(silentswap_order_id: String)]
pub struct CreatePaymentRecord<'info> {
    #[account(
        init,
        payer = owner,
        space = PaymentRecord::space(&silentswap_order_id),
        seeds = [
            b"payment",
            employer.key().as_ref(),
            recipient.key().as_ref(),
            &employer.payment_count.to_le_bytes()
        ],
        bump
    )]
    pub payment_record: Account<'info, PaymentRecord>,
    
    #[account(
        mut,
        seeds = [b"employer", owner.key().as_ref()],
        bump = employer.bump,
        has_one = owner
    )]
    pub employer: Account<'info, Employer>,
    
    #[account(
        seeds = [b"recipient", employer.key().as_ref(), recipient.wallet.as_ref()],
        bump = recipient.bump,
        has_one = employer
    )]
    pub recipient: Account<'info, Recipient>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdatePaymentRecord<'info> {
    #[account(
        mut,
        has_one = employer
    )]
    pub payment_record: Account<'info, PaymentRecord>,
    
    #[account(
        seeds = [b"employer", owner.key().as_ref()],
        bump = employer.bump,
        has_one = owner
    )]
    pub employer: Account<'info, Employer>,
    
    pub owner: Signer<'info>,
}

// ============================================================================
// STATE
// ============================================================================

#[account]
pub struct Employer {
    /// Wallet that owns this employer account
    pub owner: Pubkey,
    /// Business/employer name
    pub name: String,
    /// Number of recipients added
    pub recipient_count: u32,
    /// Number of payment records created
    pub payment_count: u32,
    /// Account creation timestamp
    pub created_at: i64,
    /// PDA bump
    pub bump: u8,
}

impl Employer {
    pub fn space(name: &str) -> usize {
        8 +                     // discriminator
        32 +                    // owner
        4 + name.len() +        // name (string)
        4 +                     // recipient_count
        4 +                     // payment_count
        8 +                     // created_at
        1                       // bump
    }
}

#[account]
pub struct Recipient {
    /// Parent employer account
    pub employer: Pubkey,
    /// Payment destination wallet
    pub wallet: Pubkey,
    /// Display name
    pub name: String,
    /// Role/label (e.g., "Engineer", "Designer")
    pub role: String,
    /// Whether recipient is active
    pub is_active: bool,
    /// Account creation timestamp
    pub created_at: i64,
    /// PDA bump
    pub bump: u8,
}

impl Recipient {
    pub fn space(name: &str, role: &str) -> usize {
        8 +                     // discriminator
        32 +                    // employer
        32 +                    // wallet
        4 + name.len() +        // name (string)
        4 + role.len() +        // role (string)
        1 +                     // is_active
        8 +                     // created_at
        1                       // bump
    }
}

#[account]
pub struct PaymentRecord {
    /// Parent employer account
    pub employer: Pubkey,
    /// Recipient account (PDA)
    pub recipient: Pubkey,
    /// Recipient wallet (for reference)
    pub recipient_wallet: Pubkey,
    /// Payment status
    pub status: PaymentStatus,
    /// SilentSwap order ID (for reference)
    pub silentswap_order_id: String,
    /// Record creation timestamp
    pub created_at: i64,
    /// Last update timestamp
    pub updated_at: i64,
    /// PDA bump
    pub bump: u8,
}

impl PaymentRecord {
    pub fn space(order_id: &str) -> usize {
        8 +                     // discriminator
        32 +                    // employer
        32 +                    // recipient
        32 +                    // recipient_wallet
        1 +                     // status (enum)
        4 + order_id.len() +    // silentswap_order_id (string)
        8 +                     // created_at
        8 +                     // updated_at
        1                       // bump
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum PaymentStatus {
    Pending,
    Completed,
    Failed,
}

// ============================================================================
// ERRORS
// ============================================================================

#[error_code]
pub enum PayrollError {
    #[msg("Name exceeds maximum length")]
    NameTooLong,
    #[msg("Role exceeds maximum length")]
    RoleTooLong,
    #[msg("Order ID exceeds maximum length")]
    OrderIdTooLong,
    #[msg("Invalid payment status for this operation")]
    InvalidPaymentStatus,
}
