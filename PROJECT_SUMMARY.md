# SilentSwap Payroll - Project Summary

## Overview

A Solana dApp for private payroll and bulk payouts using SilentSwap's privacy-preserving protocol. Built for the Privacy Hackathon 2026 - SilentSwap track.

## Key Features

✅ **Private Payroll System**
- Execute bulk payouts without revealing payment history on-chain
- Each recipient receives funds through separate private swaps
- Up to 5 recipients per batch

✅ **Dual Wallet Support**
- Solana wallet (Phantom/Solflare) for source transactions
- EVM wallet (MetaMask/WalletConnect) for facilitator operations
- Automatic wallet connection management

✅ **Real-time Tracking**
- Monitor swap status in real-time
- View order history
- Error handling and status updates

✅ **Address Validation**
- Solana address validation
- Real-time error feedback
- Input sanitization

## Architecture

### Frontend Stack
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **SilentSwap React SDK** - Privacy protocol integration
- **Wagmi + RainbowKit** - EVM wallet connection
- **Solana Wallet Adapter** - Solana wallet connection

### Backend/On-chain
- **Anchor Framework** - Solana program structure (placeholder for future features)
- **SilentSwap Protocol** - Privacy layer for swaps

## Project Structure

```
silentswap-payroll/
├── app/                      # Next.js app directory
│   ├── layout.tsx           # Root layout with providers
│   ├── page.tsx             # Main dashboard page
│   ├── providers.tsx        # Wallet & SilentSwap providers
│   └── globals.css          # Global styles
├── components/              # React components
│   ├── PayrollDashboard.tsx # Main dashboard component
│   ├── PayrollForm.tsx      # Payroll creation form
│   ├── RecipientInput.tsx   # Individual recipient input
│   └── PayrollHistory.tsx   # Order history display
├── hooks/                   # Custom React hooks
│   └── useUserAddress.ts    # Wallet address management
├── utils/                   # Utility functions
│   └── solana.ts           # Solana address validation
├── programs/                # Anchor program
│   └── silentswap-payroll/
│       └── src/
│           └── lib.rs      # Solana program (placeholder)
└── Configuration files
```

## How It Works

### Private Payout Flow

1. **Setup Phase**
   - User connects both Solana and EVM wallets
   - System validates wallet connections

2. **Configuration Phase**
   - User selects source asset (SOL or USDC)
   - User adds recipients (up to 5) with:
     - Solana address (validated)
     - Amount
     - Destination asset

3. **Execution Phase**
   - For each recipient, a separate SilentSwap transaction is executed
   - Each swap routes through ephemeral facilitator accounts
   - Transaction paths are obfuscated

4. **Tracking Phase**
   - Real-time status updates
   - Order history tracking
   - Error handling and recovery

### Privacy Mechanism

- **Ephemeral Facilitator Accounts**: Each swap uses temporary accounts
- **Shielded Transactions**: Transaction paths are obfuscated
- **No Direct Links**: No on-chain connection between sender and recipients
- **Private History**: Payment history remains private

## Integration Points

### SilentSwap Integration

- Uses `SilentSwapProvider` for global state management
- `useSilentSwap` hook for swap execution
- `useOrdersContext` for order tracking
- Automatic authentication via SIWE
- Facilitator wallet generation and management

### Wallet Integration

- **Solana**: Phantom, Solflare via Solana Wallet Adapter
- **EVM**: MetaMask, WalletConnect via RainbowKit
- Dual connection required for SilentSwap operations

## Important Considerations

### Mainnet Only

⚠️ SilentSwap currently operates on **mainnet only**:
- Real funds required for testing
- Test with small amounts initially
- Double-check all addresses and amounts
- Monitor transactions carefully

### Testing Strategy

1. Start with single recipient, small amount (0.01 SOL)
2. Verify recipient address carefully
3. Monitor transaction status
4. Check order history for confirmation
5. Scale up gradually

### Error Handling

- Address validation before submission
- Real-time error feedback
- Transaction status monitoring
- Graceful error recovery
- User-friendly error messages

## Environment Variables

Required in `.env.local`:

```env
NEXT_PUBLIC_SILENTSWAP_ENV=staging
NEXT_PUBLIC_INTEGRATOR_ID=your_integrator_id
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

## Future Enhancements

Potential improvements for production:

- [ ] Batch optimization (single transaction for multiple recipients)
- [ ] On-chain payroll program integration
- [ ] CSV import for bulk recipients
- [ ] Recurring payroll scheduling
- [ ] Payment templates
- [ ] Advanced analytics
- [ ] Multi-signature support
- [ ] Integration with payroll systems

## Hackathon Submission

**Track**: SilentSwap - Private Cross-Chain Transfers  
**Prize Pool**: $5,000  
**Use Case**: Private payroll / payouts  
**Model**: Bulk payouts as multiple swaps into ephemeral facilitator accounts

## Resources

- [SilentSwap Documentation](https://docs.silentswap.com/getting-started)
- [SilentSwap React SDK](https://docs.silentswap.com/react-integration)
- [Solana Documentation](https://docs.solana.com/)
- [Anchor Framework](https://www.anchor-lang.com/)

## License

MIT
