# SilentSwap Payroll - Private Payouts on Solana

A Solana dApp for private payroll and bulk payouts using SilentSwap. This application allows you to pay contributors, employees, or partners without broadcasting their full payment history on-chain.

## 🎯 Project Overview

This project was built for the **Privacy Hackathon 2026** - Solana track, specifically for the **SilentSwap** challenge.

### Features

- **Private Payroll**: Execute bulk payouts without revealing payment history on-chain
- **Multi-Recipient Support**: Pay up to 5 recipients in a single batch
- **SilentSwap Integration**: Leverages SilentSwap's privacy-preserving swap protocol
- **Dual Wallet Support**: Requires both Solana and EVM wallets for facilitator operations
- **Real-time Tracking**: Monitor payout status and order history

## 🏗️ Architecture

The application uses:
- **Frontend**: Next.js 14 with React and TypeScript
- **Solana Integration**: Anchor framework for on-chain programs
- **Privacy Layer**: SilentSwap React SDK for private swaps
- **Wallet Support**: 
  - Solana: Phantom, Solflare
  - EVM: RainbowKit (MetaMask, WalletConnect, etc.)

## 📋 Prerequisites

- Node.js 18+ and npm/pnpm
- Solana CLI tools
- Anchor framework
- Both Solana and EVM wallets (for testing on mainnet)

## 🚀 Getting Started

### 1. Install Dependencies

**Frontend (Next.js app):**
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

### 2. Environment Setup

Copy `.env.example` to `.env.local` in the `app` folder and fill in your configuration:

```bash
cd app
cp .env.example .env.local
```

**Required environment variables:**
- `NEXT_PUBLIC_SILENTSWAP_ENV`: SilentSwap environment (`staging` or `production`) - **Required**
- `NEXT_PUBLIC_SOLANA_RPC_URL`: Solana RPC endpoint - **Required** (recommended to use private RPC)

**Optional environment variables:**
- `NEXT_PUBLIC_INTEGRATOR_ID`: Your SilentSwap integrator ID (optional, for tracking)
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`: WalletConnect project ID (optional but recommended)

📖 **See `app/ENV_SETUP_GUIDE.md` for detailed instructions on how to get each variable.**

### 3. Build Anchor Program (Optional)

```bash
anchor build
```

### 4. Run Development Server

```bash
cd app
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔐 Wallet Connection

**Important**: SilentSwap requires both wallets to be connected:

1. **Solana Wallet**: Connect using Phantom or Solflare
2. **EVM Wallet**: Connect using RainbowKit (MetaMask, etc.)

Both wallets are required because:
- Solana wallet: For signing Solana transactions (source swaps)
- EVM wallet: For facilitator operations and deposit calldata

## 💰 How It Works

### Private Payroll Flow

1. **Setup**: Connect both Solana and EVM wallets
2. **Configure**: 
   - Select source asset (SOL or USDC)
   - Add recipients with their Solana addresses and amounts
   - Up to 5 recipients per batch
3. **Execute**: Each recipient receives funds through a separate private swap
4. **Track**: Monitor order status and view payout history

### Privacy Mechanism

Each payout is executed as an individual SilentSwap transaction:
- Funds are routed through ephemeral facilitator accounts
- Transaction paths are obfuscated using shielded transactions
- No direct on-chain link between sender and recipients
- Payment history remains private

## ⚠️ Important Notes

### Mainnet Only

SilentSwap currently operates on **mainnet only** (not devnet). This means:
- Real funds are required for testing
- Test with small amounts initially
- Double-check all addresses and amounts before executing

### Testing Recommendations

1. Start with a single recipient and small amount
2. Verify recipient addresses carefully
3. Monitor transaction status in the UI
4. Check order history for confirmation

## 📁 Project Structure

```
silentswap-payroll/
├── app/                    # Next.js frontend (deployed to Vercel)
│   ├── package.json       # Frontend dependencies
│   ├── next.config.js     # Next.js configuration
│   ├── tsconfig.json      # TypeScript configuration
│   ├── tailwind.config.ts # Tailwind CSS configuration
│   ├── .env.local.example # Environment variables template
│   ├── ENV_VARIABLES.md   # Environment variables documentation
│   └── src/               # Source directory
│       ├── app/           # Next.js app directory
│       │   ├── layout.tsx # Root layout with providers
│       │   ├── page.tsx   # Main page
│       │   ├── providers.tsx # Wallet and SilentSwap providers
│       │   └── globals.css # Global styles
│       ├── components/    # React components
│       │   ├── PayrollDashboard.tsx
│       │   ├── PayrollForm.tsx
│       │   ├── RecipientInput.tsx
│       │   └── PayrollHistory.tsx
│       ├── hooks/         # Custom React hooks
│       │   └── useUserAddress.ts
│       └── utils/          # Utility functions
│           └── solana.ts
├── programs/              # Anchor program (backend)
│   └── silentswap-payroll/
│       └── src/
│           └── lib.rs
├── package.json           # Backend dependencies (Anchor)
├── Anchor.toml            # Anchor configuration
└── vercel.json            # Vercel deployment configuration
```

## 🔧 Development

### Frontend Development

```bash
cd app
npm run dev    # Start development server
npm run build  # Build for production
npm run lint   # Run linter
```

### Backend Development (Anchor)

```bash
# From root directory
npm run anchor:build   # Build Anchor program
npm run anchor:test    # Test Anchor program
npm run anchor:deploy  # Deploy Anchor program
```

### Anchor Commands

```bash
# Build program
npm run anchor:build

# Test program
npm run anchor:test

# Deploy program
npm run anchor:deploy
```

## 📚 Resources

- [SilentSwap Documentation](https://docs.silentswap.com/getting-started)
- [SilentSwap React SDK](https://docs.silentswap.com/react-integration)
- [Solana Documentation](https://docs.solana.com/)
- [Anchor Framework](https://www.anchor-lang.com/)

## 🎯 Hackathon Submission

This project addresses the **SilentSwap** track:
- **Challenge**: Private Cross-Chain Transfers
- **Prize Pool**: $5,000
- **Use Case**: Private payroll / payouts
- **Model**: Bulk payouts as multiple swaps into ephemeral facilitator accounts

## 📝 License

MIT

## 🙏 Acknowledgments

- SilentSwap team for the privacy infrastructure
- Solana Foundation for the hackathon opportunity
- Privacy Hackathon 2026 organizers
