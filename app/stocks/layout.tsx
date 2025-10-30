import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Verified Indian Stocks - Live NSE Stock Market Prices & Analysis | IncomeGrow Stock',
  description: 'Explore 500+ verified Indian stocks with real-time NSE prices, financial analysis, P/E ratios, market cap, and growth metrics. Track top-performing stocks with comprehensive financial data and detailed sector analysis.',
  keywords: [
    'Indian stocks',
    'NSE stocks',
    'BSE stocks',
    'live stock prices',
    'stock market India',
    'verified stocks',
    'stock analysis',
    'market capitalization',
    'P/E ratio',
    'stock screener',
    'financial data',
    'stock growth',
    'profit margin',
    'sales growth',
    'equity shares',
    'stock sectors',
    'real-time stock prices',
    'Yahoo Finance India',
    'stock market analysis',
    'investment stocks',
    'Indian equity market',
    'NSE live prices',
    'stock portfolio',
    'fundamental analysis',
    'stock valuation',
    'market trends',
    'stock research',
    'financial ratios',
    'stock performance',
    'market data',
  ].join(', '),

  // Open Graph metadata for social sharing
  openGraph: {
    title: 'Verified Indian Stocks - Live NSE Prices & Financial Analysis',
    description: 'Track 500+ verified Indian stocks with real-time prices, P/E ratios, market cap, and comprehensive financial analysis. Make informed investment decisions.',
    type: 'website',
    locale: 'en_IN',
    siteName: 'IncomeGrow Stock',
    images: [
      {
        url: '/og-stocks.jpg',
        width: 1200,
        height: 630,
        alt: 'IncomeGrow Stock - Verified Stocks',
      },
    ],
  },

  // Twitter Card metadata
  twitter: {
    card: 'summary_large_image',
    title: 'Verified Indian Stocks - Live NSE Prices & Analysis',
    description: 'Track 500+ verified stocks with real-time prices, financial analysis, and growth metrics.',
    images: ['/og-stocks.jpg'],
  },

  // Additional metadata
  alternates: {
    canonical: 'https://stock.incomegrow.in/stocks',
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Search Engine Verification Codes
  // HOW TO GET GOOGLE VERIFICATION CODE:
  // 1. Go to https://search.google.com/search-console/
  // 2. Click "Add Property" → Enter: https://stock.incomegrow.in
  // 3. Choose "HTML tag" method
  // 4. Copy the code from: <meta name="google-site-verification" content="YOUR_CODE_HERE" />
  // 5. Paste YOUR_CODE_HERE below (replace 'PASTE_YOUR_CODE_HERE')
  // 6. Deploy your site and click "Verify" in Google Search Console
  // See GOOGLE_VERIFICATION_GUIDE.md for detailed instructions
  verification: {
    google: 'gFB8z-QG4ewMlsxc2iYHIFrYY8PiogkBZwOcuulPcHM', // ← Replace with your actual code from Google Search Console
    // yandex: 'PASTE_YOUR_YANDEX_CODE_HERE',           // Optional: https://webmaster.yandex.com/
    // bing: 'PASTE_YOUR_BING_CODE_HERE',               // Optional: https://www.bing.com/webmasters/
  },

  // Category for better classification
  category: 'finance',
};

export default function StocksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
