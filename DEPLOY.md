# MemoryVault Pro - Deployment Guide

## Quick Deploy to Vercel

### Option 1: Vercel CLI (Recommended)

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
 cd frontend
vercel --prod
```

### Option 2: Vercel Git Integration

1. Push your code to GitHub
2. Import project in Vercel dashboard
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Deploy!

### Option 3: Manual Upload

1. Run `npm run build` in the frontend directory
2. Go to [vercel.com/new](https://vercel.com/new)
3. Upload the `dist` folder
4. Deploy!

## Environment Variables

Set these in your Vercel project settings:

```
VITE_CONTRACT_REGISTRY=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
VITE_CONTRACT_NFT=0x5FbDB2315678afecb367f032d93F642f64180aa3
VITE_CHAIN_ID=84532
```

## Custom Domain

To use a custom domain:

1. Go to Project Settings → Domains
2. Add your domain
3. Update DNS records as instructed

## Base Sepolia Deployment

To deploy to Base Sepolia:

1. Get test ETH from [Base Sepolia Faucet](https://www.alchemy.com/faucets/base-sepolia)
2. Update `.env` with your funded private key
3. Run `npm run deploy:base-sepolia`
4. Update contract addresses in frontend config
5. Redeploy frontend

## Contract Verification

```bash
# Verify on BaseScan
npx hardhat verify --network base-sepolia \
  0xYOUR_NFT_ADDRESS \
  "MemoryVault Access" \
  "MVAULT" \
  0xYOUR_REGISTRY_ADDRESS

npx hardhat verify --network base-sepolia \
  0xYOUR_REGISTRY_ADDRESS \
  0xYOUR_NFT_ADDRESS
```

## Troubleshooting

### Build Errors
- Make sure all dependencies are installed: `npm install`
- Check Node.js version (requires 18+)
- Clear cache: `rm -rf node_modules && npm install`

### Contract Interaction Errors
- Ensure you're on the correct network
- Check that contract addresses are correct
- Verify you have test ETH for gas

### Wallet Connection Issues
- Make sure your wallet is unlocked
- Check that you're on the right network
- Try refreshing the page

## Support

For issues and feature requests, please use GitHub Issues.
