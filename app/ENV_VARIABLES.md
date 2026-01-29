# Environment Variables Usage

This document explains where and how each environment variable is used in the application.

## Environment Variables

### 1. `NEXT_PUBLIC_SILENTSWAP_ENV`
**Location**: `src/app/providers.tsx` (line 35)  
**Usage**: 
```typescript
const environment = (process.env.NEXT_PUBLIC_SILENTSWAP_ENV as any) || ENVIRONMENT.STAGING;
const client = createSilentSwapClient({ environment });
```
**Purpose**: Sets the SilentSwap environment (staging or production)  
**Default**: `ENVIRONMENT.STAGING`  
**Required**: No (has default)

### 2. `NEXT_PUBLIC_INTEGRATOR_ID`
**Location**: `src/components/PayrollForm.tsx` (line 127)  
**Usage**:
```typescript
integratorId: process.env.NEXT_PUBLIC_INTEGRATOR_ID,
```
**Purpose**: Optional integrator ID for tracking swaps in SilentSwap  
**Default**: `undefined` (optional)  
**Required**: No

### 3. `NEXT_PUBLIC_SOLANA_RPC_URL`
**Location**: `src/app/providers.tsx` (lines 49 and 68)  
**Usage**:
```typescript
// Line 49 - SilentSwap provider
solanaRpcUrl={process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com"}

// Line 68 - Solana connection provider
endpoint={process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com"}
```
**Purpose**: Solana RPC endpoint URL for blockchain interactions  
**Default**: `"https://api.mainnet-beta.solana.com"`  
**Required**: No (has default)

## Summary

| Variable | Required | Default | Used In |
|----------|----------|---------|---------|
| `NEXT_PUBLIC_SILENTSWAP_ENV` | No | `ENVIRONMENT.STAGING` | `providers.tsx` |
| `NEXT_PUBLIC_INTEGRATOR_ID` | No | `undefined` | `PayrollForm.tsx` |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | No | Mainnet RPC | `providers.tsx` (2 places) |

**Note**: WalletConnect is no longer used. The app now uses Phantom wallet for both Solana and EVM connections via the injected connector.

## Notes

- All environment variables must be prefixed with `NEXT_PUBLIC_` to be accessible in the browser
- Variables are read at build time in Next.js
- For production, set these in Vercel dashboard or your deployment platform
- The `.env.local` file is for local development only and should not be committed to git
