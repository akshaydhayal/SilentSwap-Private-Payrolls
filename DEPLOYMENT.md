# Deployment Guide

## Project Structure

This project is structured as a monorepo with separate frontend and backend:

```
silentswap-payroll/
├── app/                    # Frontend (Next.js) - Deploy to Vercel
│   ├── package.json       # Frontend dependencies
│   ├── app/               # Next.js app directory
│   ├── components/        # React components
│   ├── hooks/             # Custom hooks
│   └── utils/             # Utilities
├── programs/              # Anchor program (backend)
├── package.json           # Backend dependencies (Anchor)
└── vercel.json            # Vercel configuration
```

## Vercel Deployment

### Prerequisites

1. Vercel account
2. GitHub repository (or other Git provider)
3. Environment variables ready

### Deployment Steps

1. **Connect Repository to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your Git repository

2. **Configure Project Settings**
   - **Root Directory**: Set to `app`
   - **Framework Preset**: Next.js (auto-detected)
   - **Build Command**: `npm run build` (runs in `app` directory)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (runs in `app` directory)

3. **Set Environment Variables**
   In Vercel project settings, add:
   ```
   NEXT_PUBLIC_SILENTSWAP_ENV=staging
   NEXT_PUBLIC_INTEGRATOR_ID=your_integrator_id
   NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
   ```

4. **Deploy**
   - Click "Deploy"
   - Vercel will automatically build and deploy from the `app` directory

### Vercel Configuration

The `vercel.json` file in the root configures:
- `rootDirectory: "app"` - Tells Vercel to use `app` folder as root
- Framework auto-detection for Next.js

### Environment Variables

All environment variables must be set in Vercel dashboard:
- Go to Project Settings → Environment Variables
- Add each variable for Production, Preview, and Development

### Custom Domain

1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

## Local Development

```bash
cd app
npm install
npm run dev
```

## Build Verification

Before deploying, verify the build works locally:

```bash
cd app
npm run build
npm start
```

## Troubleshooting

### Build Fails

- Check that all dependencies are in `app/package.json`
- Verify environment variables are set
- Check build logs in Vercel dashboard

### Import Errors

- Ensure `tsconfig.json` paths are correct (`@/*` maps to `./*`)
- Verify all files are in the `app` directory structure

### Runtime Errors

- Check browser console for errors
- Verify environment variables are accessible (must start with `NEXT_PUBLIC_`)
- Check network requests in browser DevTools

## Continuous Deployment

Vercel automatically deploys on:
- Push to `main` branch → Production
- Push to other branches → Preview
- Pull requests → Preview deployment

## Manual Deployment

You can also deploy manually using Vercel CLI:

```bash
npm i -g vercel
cd app
vercel
```
