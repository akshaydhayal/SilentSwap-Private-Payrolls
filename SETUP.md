# Setup Guide

## Quick Start

### 1. Install Dependencies

**Frontend (for Vercel deployment):**
```bash
cd app
npm install
# or
pnpm install
```

**Backend (Anchor program - optional):**
```bash
# From root directory
npm install
```

### 2. Environment Configuration

Create a `.env.local` file in the `app` directory:

```bash
cd app
cp .env.local.example .env.local
```

Edit `.env.local` with your configuration:

```env
# SilentSwap Configuration
NEXT_PUBLIC_SILENTSWAP_ENV=staging
NEXT_PUBLIC_INTEGRATOR_ID=your_integrator_id_here

# Solana Configuration
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# EVM Configuration
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

**Note**: SilentSwap is mainnet-only. Use real funds carefully.

### 3. Run Development Server

```bash
cd app
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Wallet Setup

### Required Wallets

1. **Solana Wallet** (Phantom or Solflare)
   - Install from browser extension store
   - Fund with SOL for testing

2. **EVM Wallet** (MetaMask, WalletConnect, etc.)
   - Install MetaMask or use WalletConnect
   - Fund with ETH for facilitator operations

### Connecting Wallets

1. Open the application
2. Click "Connect Solana Wallet" and approve connection
3. Click "Connect Wallet" for EVM and approve connection
4. Both wallets must be connected to use SilentSwap

## Testing on Mainnet

⚠️ **Important**: SilentSwap operates on mainnet only.

### Testing Checklist

- [ ] Both wallets connected
- [ ] Small test amount ready (start with 0.01 SOL)
- [ ] Valid recipient address verified
- [ ] Double-check all amounts before executing
- [ ] Monitor transaction status in UI

### Recommended Testing Flow

1. **Single Recipient Test**
   - Add one recipient with a small amount (0.01 SOL)
   - Verify recipient address is correct
   - Execute and monitor status

2. **Multiple Recipients Test**
   - Add 2-3 recipients with small amounts
   - Verify all addresses
   - Execute and monitor each swap

3. **Production Use**
   - Only after successful testing
   - Use appropriate amounts for your use case
   - Monitor order history for confirmation

## Troubleshooting

### Wallets Not Connecting

- Ensure browser extensions are installed and unlocked
- Try refreshing the page
- Check browser console for errors

### Swap Fails

- Verify both wallets are connected
- Check recipient addresses are valid Solana addresses
- Ensure sufficient balance for fees
- Check network connection

### Order Status Not Updating

- Refresh the orders list
- Check SilentSwap service status
- Verify order ID in SilentSwap dashboard (if available)

## Building for Production

**Frontend:**
```bash
cd app
npm run build
npm start
```

**Vercel Deployment:**
The `app` folder is configured for Vercel deployment. Vercel will automatically:
- Detect Next.js framework
- Install dependencies from `app/package.json`
- Build using `npm run build`
- Deploy from `app` directory

Make sure to set environment variables in Vercel dashboard.

## Anchor Program (Optional)

If you want to deploy the Anchor program:

```bash
# Build
anchor build

# Deploy (mainnet)
anchor deploy --provider.cluster mainnet-beta
```

**Note**: Update `Anchor.toml` with your program ID after deployment.

## Support

- [SilentSwap Docs](https://docs.silentswap.com)
- [Solana Docs](https://docs.solana.com)
- Check browser console for detailed error messages
