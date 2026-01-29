# Environment Variables - Quick Reference

## Required vs Optional

### ✅ **REQUIRED** (Minimum to run the app)

| Variable | Default | Where to Get |
|----------|---------|--------------|
| `NEXT_PUBLIC_SILENTSWAP_ENV` | `staging` | Use `staging` for testing, `production` for mainnet |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | Public RPC | Get free RPC from [Helius](https://www.helius.dev/) or [QuickNode](https://www.quicknode.com/) |

### ⚠️ **OPTIONAL** (But Recommended)

| Variable | Default | Where to Get | Why Recommended |
|----------|---------|--------------|-----------------|
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | `"default"` | [WalletConnect Cloud](https://cloud.walletconnect.com/) | WalletConnect may not work without it |
| `NEXT_PUBLIC_INTEGRATOR_ID` | `undefined` | SilentSwap team | For analytics/tracking (completely optional) |

---

## Quick Setup

### 1. Copy the example file:
```bash
cd app
cp .env.example .env.local
```

### 2. Minimum setup (app will work):
```env
NEXT_PUBLIC_SILENTSWAP_ENV=staging
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

### 3. Recommended setup (for better performance):
```env
NEXT_PUBLIC_SILENTSWAP_ENV=staging
NEXT_PUBLIC_SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

---

## Where to Get Each Variable

### 1. `NEXT_PUBLIC_SILENTSWAP_ENV`
- **No account needed**
- Just use: `staging` or `production`

### 2. `NEXT_PUBLIC_SOLANA_RPC_URL`
**Option 1: Free Public RPC (Rate Limited)**
```
https://api.mainnet-beta.solana.com
```

**Option 2: Helius (Recommended - Free Tier)**
1. Go to https://www.helius.dev/
2. Sign up (free)
3. Create API key
4. Use: `https://mainnet.helius-rpc.com/?api-key=YOUR_KEY`

**Option 3: QuickNode (Free Tier)**
1. Go to https://www.quicknode.com/
2. Sign up and create Solana endpoint
3. Copy the HTTP URL

**Option 4: Alchemy (Free Tier)**
1. Go to https://www.alchemy.com/solana
2. Sign up and create Solana app
3. Copy the HTTP endpoint

### 3. `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` (Optional)
1. Go to https://cloud.walletconnect.com/
2. Sign up / Log in
3. Create new project
4. Copy Project ID

### 4. `NEXT_PUBLIC_INTEGRATOR_ID` (Optional)
- Contact SilentSwap team
- Check hackathon documentation
- Can be left empty

---

## Summary Table

| Variable | Required? | Has Default? | Can Leave Empty? |
|----------|-----------|--------------|------------------|
| `NEXT_PUBLIC_SILENTSWAP_ENV` | ✅ Yes | ✅ Yes (`staging`) | ❌ No (but default works) |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | ✅ Yes | ✅ Yes (public RPC) | ❌ No (but default works) |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | ⚠️ Recommended | ✅ Yes (`"default"`) | ✅ Yes (but may not work) |
| `NEXT_PUBLIC_INTEGRATOR_ID` | ❌ No | ✅ Yes (`undefined`) | ✅ Yes |

---

## For More Details

See `ENV_SETUP_GUIDE.md` for step-by-step instructions on getting each variable.
