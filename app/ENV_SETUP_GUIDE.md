# Environment Variables Setup Guide

This guide explains how to get and configure all environment variables for the SilentSwap Payroll application.

## Quick Start

1. Copy `.env.example` to `.env.local`:
   ```bash
   cd app
   cp .env.example .env.local
   ```

2. Edit `.env.local` and fill in the values (see details below)

3. For Vercel deployment, add these in the Vercel dashboard under Project Settings → Environment Variables

---

## Environment Variables Overview

| Variable | Required | Default | Where Used |
|----------|----------|---------|------------|
| `NEXT_PUBLIC_SILENTSWAP_ENV` | **Yes** (for production) | `staging` | `src/app/providers.tsx` |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | **Yes** (recommended) | Mainnet RPC | `src/app/providers.tsx` |
| `NEXT_PUBLIC_INTEGRATOR_ID` | No | `undefined` | `src/components/PayrollForm.tsx` |

**Note**: WalletConnect is no longer used. The app now uses Phantom wallet for both Solana and EVM connections.

---

## Detailed Setup Instructions

### 1. `NEXT_PUBLIC_SILENTSWAP_ENV` ⚠️ **REQUIRED**

**Purpose**: Sets the SilentSwap environment (staging or production)

**Options**:
- `staging` - For testing (default)
- `production` - For mainnet/production use

**How to get**: 
- No account needed
- Use `staging` for development/testing
- Use `production` for live deployments

**Example**:
```env
NEXT_PUBLIC_SILENTSWAP_ENV=staging
```

**Note**: SilentSwap operates on mainnet only, so even "staging" uses real funds. Test carefully!

---

### 2. `NEXT_PUBLIC_SOLANA_RPC_URL` ⚠️ **REQUIRED (Recommended)**

**Purpose**: Solana RPC endpoint for blockchain interactions

**Default**: `https://api.mainnet-beta.solana.com` (public, rate-limited)

**How to get a better RPC**:

#### Option A: Helius (Recommended - Free Tier Available)
1. Go to https://www.helius.dev/
2. Sign up for a free account
3. Create a new API key
4. Use: `https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY`

#### Option B: QuickNode (Free Tier Available)
1. Go to https://www.quicknode.com/
2. Sign up and create a Solana endpoint
3. Copy the HTTP endpoint URL
4. Use that URL directly

#### Option C: Alchemy (Free Tier Available)
1. Go to https://www.alchemy.com/solana
2. Sign up and create a Solana app
3. Copy the HTTP endpoint URL

#### Option D: Use Public RPC (Not Recommended for Production)
```env
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

**Example**:
```env
NEXT_PUBLIC_SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=your_api_key_here
```

**Why it's important**: 
- Public RPC has rate limits
- Private RPC provides better reliability and performance
- Free tiers are usually sufficient for development

---

### 3. `NEXT_PUBLIC_INTEGRATOR_ID` ✅ **OPTIONAL**

**Purpose**: Optional tracking ID for analytics with SilentSwap

**Default**: `undefined` (can be left empty)

**How to get**:
1. Contact SilentSwap team
2. Check SilentSwap documentation
3. May be provided during hackathon registration

**Example**:
```env
NEXT_PUBLIC_INTEGRATOR_ID=your_integrator_id_here
```

**Note**: This is completely optional. The app works fine without it.

---

### 4. `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` ⚠️ **OPTIONAL (But Recommended)**

**Purpose**: Enables WalletConnect for EVM wallet connections

**Default**: `"default"` (may not work properly in production)

**How to get**:

1. **Go to WalletConnect Cloud**:
   - Visit https://cloud.walletconnect.com/

2. **Sign Up / Log In**:
   - Create a free account or log in

3. **Create a Project**:
   - Click "Create New Project"
   - Enter project name (e.g., "SilentSwap Payroll")
   - Select "App" as project type
   - Click "Create"

4. **Copy Project ID**:
   - You'll see your Project ID (format: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
   - Copy this value

**Example**:
```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=abc123def456ghi789jkl012mno345pq
```

**Why it's recommended**:
- Without it, WalletConnect connections may fail
- Free to get
- Takes 2 minutes to set up
- Required for EVM wallet connections via WalletConnect

**Note**: If you're only using MetaMask browser extension, this is less critical, but still recommended.

---

## Setup Checklist

### For Local Development:
- [ ] Copy `.env.example` to `.env.local`
- [ ] Set `NEXT_PUBLIC_SILENTSWAP_ENV` (staging or production)
- [ ] Set `NEXT_PUBLIC_SOLANA_RPC_URL` (get free RPC from Helius/QuickNode/Alchemy)
- [ ] (Optional) Set `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` (get from walletconnect.com)
- [ ] (Optional) Set `NEXT_PUBLIC_INTEGRATOR_ID` if you have one

### For Vercel Deployment:
- [ ] Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- [ ] Add all variables from `.env.local`
- [ ] Set for Production, Preview, and Development environments
- [ ] Redeploy after adding variables

---

## Testing Your Setup

1. **Start the development server**:
   ```bash
   cd app
   npm run dev
   ```

2. **Check browser console**:
   - Open DevTools (F12)
   - Look for any errors related to missing environment variables
   - Check Network tab for RPC calls

3. **Test wallet connections**:
   - Try connecting Solana wallet
   - Try connecting EVM wallet
   - Both should work if configured correctly

---

## Troubleshooting

### "WalletConnect not working"
- Make sure `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is set
- Verify the Project ID is correct (no extra spaces)
- Check that it's set in Vercel if deployed

### "RPC rate limit errors"
- Get a private RPC endpoint (Helius/QuickNode/Alchemy)
- Update `NEXT_PUBLIC_SOLANA_RPC_URL`

### "SilentSwap not connecting"
- Verify `NEXT_PUBLIC_SILENTSWAP_ENV` is set correctly
- Check browser console for errors
- Ensure both wallets are connected

### "Environment variables not working in production"
- Make sure variables are set in Vercel dashboard
- Variables must start with `NEXT_PUBLIC_` to be accessible in browser
- Redeploy after adding variables

---

## Security Notes

⚠️ **Important**:
- Never commit `.env.local` to git (it's in `.gitignore`)
- Environment variables starting with `NEXT_PUBLIC_` are exposed to the browser
- Don't put sensitive secrets in `NEXT_PUBLIC_` variables
- For Vercel, use their dashboard to set environment variables securely

---

## Quick Reference

**Minimum required for local development**:
```env
NEXT_PUBLIC_SILENTSWAP_ENV=staging
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

**Recommended for production**:
```env
NEXT_PUBLIC_SILENTSWAP_ENV=production
NEXT_PUBLIC_SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_INTEGRATOR_ID=your_integrator_id
```

---

## Need Help?

- Check `ENV_VARIABLES.md` for technical details
- Review SilentSwap docs: https://docs.silentswap.com
- Check browser console for specific error messages
