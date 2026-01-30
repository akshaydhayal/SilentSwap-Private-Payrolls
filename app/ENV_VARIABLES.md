# Environment Variables for SilentSwap Payroll

This document explains all environment variables used in the application.

## Required Setup

### For Production (Mainnet)

Create a `.env.local` file in the `app/` directory:

```bash
# SilentSwap Environment - Use MAINNET for production
NEXT_PUBLIC_SILENTSWAP_ENV=MAINNET

# Solana RPC URL - Use a reliable RPC for production
# Options: 
# - https://api.mainnet-beta.solana.com (free, rate limited)
# - Get a dedicated RPC from Helius, QuickNode, or Alchemy for better reliability
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# Optional: Integrator ID for tracking (get from SilentSwap team)
# NEXT_PUBLIC_INTEGRATOR_ID=your-integrator-id
```

### For Development (Staging)

```bash
# SilentSwap Environment - Use STAGING for testing
NEXT_PUBLIC_SILENTSWAP_ENV=STAGING

# Solana RPC (mainnet is still required as SilentSwap only works on mainnet)
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_SILENTSWAP_ENV` | No | `STAGING` | SilentSwap environment: `MAINNET` or `STAGING` |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | No | Solana Mainnet | Solana RPC endpoint URL |
| `NEXT_PUBLIC_INTEGRATOR_ID` | No | `undefined` | Optional integrator ID for analytics |

## Detailed Variable Information

### `NEXT_PUBLIC_SILENTSWAP_ENV`

**Purpose**: Determines which SilentSwap environment to use.

**Values**:
- `STAGING` (default): Use for development and testing. May have different behavior.
- `MAINNET`: Use for production with real funds.

**Where it's used**: `src/app/providers.tsx`

```typescript
const environment = useMemo(() => {
  const envSetting = process.env.NEXT_PUBLIC_SILENTSWAP_ENV;
  if (envSetting === 'MAINNET' || envSetting === 'mainnet') {
    return ENVIRONMENT.MAINNET;
  }
  return ENVIRONMENT.STAGING;
}, [ENVIRONMENT]);
```

---

### `NEXT_PUBLIC_SOLANA_RPC_URL`

**Purpose**: Solana blockchain RPC endpoint for all Solana interactions.

**Default**: `https://api.mainnet-beta.solana.com`

**Recommended RPC Providers**:
- [Helius](https://helius.dev/) - Free tier available
- [QuickNode](https://quicknode.com/) - High performance
- [Alchemy](https://www.alchemy.com/) - Reliable
- [Triton](https://triton.one/) - Good for dApps

**Note**: SilentSwap only operates on Solana Mainnet. There is no devnet/testnet support.

**Where it's used**: 
1. `src/app/providers.tsx` - ConnectionProvider for Solana Wallet Adapter
2. `src/app/providers.tsx` - SilentSwapProvider's `solanaRpcUrl` prop

---

### `NEXT_PUBLIC_INTEGRATOR_ID`

**Purpose**: Optional tracking ID provided by SilentSwap for analytics and referrals.

**Where it's used**: `src/components/PayrollForm.tsx`

```typescript
await executeSwap({
  // ... other params
  integratorId: process.env.NEXT_PUBLIC_INTEGRATOR_ID,
});
```

---

## Important Notes

1. **All variables must have `NEXT_PUBLIC_` prefix** to be accessible in the browser
2. **SilentSwap only works on Mainnet** - There is no testnet/devnet support
3. **Real funds are required** for testing on mainnet - start with small amounts
4. **Both Solana and EVM wallets are required** - Use Phantom wallet for both
5. **The EVM wallet signs facilitator operations** - It needs to be connected but doesn't hold the funds being transferred

## Wallet Requirements

- **Solana Wallet**: Holds the funds being sent (SOL or SPL tokens)
- **EVM Wallet**: Signs facilitator operations for privacy routing (can be the same Phantom wallet)

Both must be connected for SilentSwap to work.
