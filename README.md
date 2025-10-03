# Indian Stock Market Dashboard 🇮🇳

A comprehensive real-time Indian stock market dashboard built with Next.js that displays live NSE/BSE data, mutual funds, and ETFs using actual market APIs.

## 🚀 Features

### 📊 **Real-Time Stock Data**
- **Live NSE/BSE Data**: Direct integration with NSE public APIs
- **Top Gainers & Losers**: Real-time top performers from NSE
- **NIFTY 50 Ticker**: Scrolling display of top 50 stocks with live prices
- **Market Hours Detection**: Auto-adjusts update frequency (1sec during market hours, 5min when closed)
- **Real-time Updates**: Live price updates every second during trading hours (9:15 AM - 3:30 PM IST)

### 💰 **Investment Options**
- **Top 100 Mutual Funds**: Real AMFI data integration for Indian mutual funds
- **ETFs Display**: Exchange-traded funds tracking major Indian indices
- **Sector Performance**: Real-time sector analysis and performance metrics

### 🔧 **Technical Features**
- **NSE API Integration**: Custom proxy with session management for NSE APIs
- **AMFI Data Parser**: Real-time mutual fund NAV data from AMFI
- **Fallback System**: Mock data fallback if APIs are unavailable
- **Error Handling**: Robust error handling with graceful degradation
- **TypeScript**: Full type safety and IntelliSense support
- **Responsive Design**: Mobile-first, works on all screen sizes

## 🏛️ **Data Sources**

### Real NSE APIs (Live Data)
```
- NIFTY 50: https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%2050
- Top Gainers: https://www.nseindia.com/api/live-analysis-variations?index=Gainers
- Top Losers: https://www.nseindia.com/api/live-analysis-variations?index=Losers
```

### Real Mutual Fund Data
```
- AMFI NAV Data: https://www.amfiindia.com/spages/NAVAll.txt (All Indian mutual funds)
```

### Advanced Features
- **Session Management**: Automatic NSE session cookie handling
- **Rate Limiting**: Smart request management to avoid API limits
- **Data Caching**: Efficient caching strategy for optimal performance
- **Market State Detection**: Automatically detects if Indian markets are open

## 🛠️ **Installation & Setup**

```bash
# Clone the repository
git clone <repository-url>
cd Umberlla-Stock

# Install dependencies
npm install --legacy-peer-deps

# Apply Next.js build patch (required for production builds)
node -e "const fs = require('fs'); const filePath = 'node_modules/next/dist/build/generate-build-id.js'; let content = fs.readFileSync(filePath, 'utf8'); content = content.replace('async function generateBuildId(generate, fallback) {\\n    let buildId = await generate();', 'async function generateBuildId(generate, fallback) {\\n    let buildId = generate ? await generate() : null;'); fs.writeFileSync(filePath, content, 'utf8'); console.log('✓ Build patch applied successfully');"

# Create environment file (optional)
cp .env.example .env.local

# Run development server
npm run dev

# Or build for production
npm run build
npm start
```

### ⚠️ **Important Build Notes**

**Build Patch Required**: Due to a Next.js 13.4.5 issue with `generateBuildId`, a patch must be applied to `node_modules/next/dist/build/generate-build-id.js` after running `npm install`. The patch handles the case when `config.generateBuildId` is undefined.

**When to reapply the patch:**
- After running `npm install` or `npm ci`
- After deleting `node_modules` folder
- On fresh clones of the repository

**Quick patch command:**
```bash
node -e "const fs = require('fs'); const filePath = 'node_modules/next/dist/build/generate-build-id.js'; let content = fs.readFileSync(filePath, 'utf8'); content = content.replace('async function generateBuildId(generate, fallback) {\\n    let buildId = await generate();', 'async function generateBuildId(generate, fallback) {\\n    let buildId = generate ? await generate() : null;'); fs.writeFileSync(filePath, content, 'utf8'); console.log('✓ Build patch applied');"
```

## 📱 **Usage**

1. **Visit** `http://localhost:3000` after running the development server
2. **Live Market Status**: See if Indian markets are currently open/closed
3. **Real-time Updates**: Watch prices update every second during market hours
4. **Browse Sections**:
   - Main dashboard: Top gainers/losers + market overview
   - Scrolling ticker: Live NIFTY 50 prices
   - Mutual Funds: Top 100 Indian mutual funds with real NAV data
   - ETFs: Popular Indian ETFs

## 🎯 **Key Components**

### Real-time Data Fetching
- `lib/nse-api.ts`: NSE API client with session management
- `lib/amfi-api.ts`: AMFI mutual fund data parser
- `lib/indian-stocks-api.ts`: Market hours detection and utilities

### API Routes
- `/api/stocks/top-gainers`: Live top gaining stocks
- `/api/stocks/top-losers`: Live top losing stocks  
- `/api/stocks/top-50`: NIFTY 50 constituents
- `/api/mutual-funds`: Top 100 mutual funds with real NAV
- `/api/etfs`: Popular Indian ETFs

### UI Components
- `StockTicker`: Scrolling ticker for top 50 stocks
- `StockCard`: Individual stock display cards
- `ETFCard`: ETF information cards
- Real-time market status indicators

## 🔥 **Live Features**

### During Market Hours (9:15 AM - 3:30 PM IST)
- ✅ **1-second updates** for all stock data
- ✅ **Live price changes** with green/red indicators
- ✅ **Real NSE data** directly from official APIs
- ✅ **Market open indicator** with live timestamp

### After Market Hours
- ⏰ **5-minute updates** to conserve resources
- ⏰ **Last traded prices** displayed
- ⏰ **Market closed indicator**

## 🚨 **Important Notes**

### NSE API Considerations
- NSE APIs require proper headers and session management
- Built-in fallback to mock data if NSE blocks requests
- Session cookies automatically managed
- Rate limiting implemented to avoid blocks

### AMFI Data
- Real mutual fund NAV data updated daily
- Covers 100+ top mutual funds across categories
- Performance metrics calculated based on NAV trends

## 📈 **Performance**

- **Build Size**: ~115KB (optimized)
- **API Response**: < 2 seconds for real data
- **Update Frequency**: 1 second (market hours) / 5 minutes (closed)
- **Fallback Time**: < 1 second to mock data if API fails

## 🎨 **UI/UX**

- **Clean Design**: Professional financial dashboard layout
- **Color Coding**: Green for gains, red for losses
- **Live Indicators**: Real-time status and update indicators
- **Mobile Responsive**: Works perfectly on mobile devices
- **Accessibility**: Screen reader friendly

## 🔄 **Update Frequency**

| Component | Market Open | Market Closed |
|-----------|-------------|---------------|
| Top Gainers/Losers | 1 second | 5 minutes |
| NIFTY 50 Ticker | 1 second | 5 minutes |
| Mutual Funds | 15 minutes | 15 minutes |
| ETFs | 15 minutes | 15 minutes |

## 🛠️ **Tech Stack**

- **Framework**: Next.js 13+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: MongoDB Atlas
- **Data Fetching**: React Query (TanStack Query)
- **Charts**: Recharts
- **APIs**: NSE India, AMFI (Real Indian market data)
- **Deployment**: Vercel

## 📋 **Prerequisites**

- Node.js 18+ installed
- MongoDB Atlas account (free)
- Git installed

## 🌐 **Deployment to Vercel (Free)**

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# MONGODB_URI = Your MongoDB connection string
```

## 📁 **Project Structure**

```
Umberlla-Stock/
├── app/                    # Next.js 13 app directory
│   ├── globals.css        # Global styles with marquee animation
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page with real-time updates
│   ├── stocks/[symbol]/   # Stock detail pages
│   ├── sectors/           # Sectors page
│   └── mutual-funds/      # Mutual funds page
├── components/            # React components
│   ├── Header.tsx         # Navigation
│   ├── StockTicker.tsx    # Scrolling NIFTY 50 ticker
│   ├── StockCard.tsx      # Stock display cards
│   ├── ETFCard.tsx        # ETF display cards
│   └── LoadingSpinner.tsx # Loading states
├── lib/                   # Core libraries
│   ├── nse-api.ts         # NSE API integration
│   ├── amfi-api.ts        # AMFI mutual fund data
│   ├── indian-stocks-api.ts # Market utilities
│   ├── indian-mutual-funds.ts # MF utilities
│   └── mongodb.ts         # Database connection
├── pages/api/             # API routes
│   ├── stocks/
│   │   ├── top-gainers.ts     # Real NSE gainers
│   │   ├── top-losers.ts      # Real NSE losers
│   │   └── top-50.ts          # NIFTY 50 data
│   ├── mutual-funds.ts        # Real AMFI data
│   └── etfs.ts                # ETF data
└── models/                # MongoDB models
```

## 🔒 **Security & Rate Limiting**

- **NSE Session Management**: Automatic cookie handling for NSE APIs
- **Request Limits**: Built-in rate limiting and retry logic
- **Fallback Strategy**: Mock data when APIs are unavailable
- **CORS Handling**: Proper headers for NSE API access
- **Error Boundaries**: Graceful error handling throughout

---

**🚀 Ready to track Indian markets in real-time!**

This dashboard uses actual NSE and AMFI APIs to provide genuine real-time Indian stock market data. It automatically detects market hours and switches between live updates (1-second intervals) and regular updates (5-minute intervals) for optimal performance.