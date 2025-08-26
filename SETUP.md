# Quick Setup Guide

## Step 1: Prerequisites
- Node.js 18+ installed
- Git installed
- Code editor (VS Code recommended)

## Step 2: Clone & Install
```bash
git clone https://github.com/yourusername/umbrella-stock.git
cd umbrella-stock
npm install
```

## Step 3: Get API Keys

### MongoDB Atlas (Free)
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for free account
3. Create a new cluster (free tier)
4. Create database user (Database Access)
5. Add your IP to allowlist (Network Access)
6. Get connection string: Connect > Connect your application > Copy connection string

### Alpha Vantage API (Free)
1. Visit https://www.alphavantage.co/support/#api-key
2. Enter your email to get free API key
3. Check your email and copy the API key

## Step 4: Configure Environment
```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xyz.mongodb.net/umbrella-stock?retryWrites=true&w=majority
ALPHA_VANTAGE_API_KEY=your_api_key_here
```

## Step 5: Run Development Server
```bash
npm run dev
```
Visit: http://localhost:3000

## Step 6: Deploy to Vercel (Free)
1. Push code to GitHub
2. Go to https://vercel.com
3. Import your GitHub repository
4. Add environment variables in project settings
5. Deploy!

## Troubleshooting

### Common Issues:
1. **MongoDB connection fails**: Check connection string and IP allowlist
2. **API key invalid**: Verify Alpha Vantage key in email
3. **Build fails**: Run `npm run type-check` to check TypeScript errors
4. **Slow API responses**: Alpha Vantage free tier has rate limits (5 req/min)

### Commands:
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Check code quality
- `npm run type-check` - TypeScript validation

### Free Tier Limits:
- **Alpha Vantage**: 5 requests/minute, 500/day
- **MongoDB Atlas**: 512 MB storage, shared cluster
- **Vercel**: 100 GB bandwidth, unlimited sites

Need help? Check the main README.md for detailed documentation!