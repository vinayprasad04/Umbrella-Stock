import { Inter } from 'next/font/google';
import QueryProvider from '@/lib/react-query';
import { AuthProvider } from '@/lib/AuthContext';
import ConditionalFooter from '@/components/ConditionalFooter';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  metadataBase: new URL('https://stock.incomegrow.in'),
  title: {
    default: 'IncomeGrow Stock - Indian Stock Market Live Prices & Analysis',
    template: '%s | IncomeGrow Stock',
  },
  description: 'Track live Indian stock prices (NSE/BSE), analyze 500+ verified stocks with real-time data, financial ratios, P/E, market cap, and comprehensive sector analysis. Make informed investment decisions.',
  keywords: 'Indian stock market, NSE live prices, BSE stocks, stock analysis, real-time stock prices, stock tracker, financial analysis, P/E ratio, market cap, stock screener, investment India, equity market, stock portfolio, Yahoo Finance India, fundamental analysis',
  authors: [{ name: 'IncomeGrow Stock' }],
  creator: 'IncomeGrow Stock',
  publisher: 'IncomeGrow Stock',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://stock.incomegrow.in',
    siteName: 'IncomeGrow Stock',
    title: 'IncomeGrow Stock - Indian Stock Market Live Prices & Analysis',
    description: 'Track live Indian stock prices with comprehensive financial analysis. Real-time NSE/BSE data for 500+ verified stocks.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'IncomeGrow Stock - Stock Market Tracker',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IncomeGrow Stock - Indian Stock Market Live Prices',
    description: 'Track live Indian stock prices with comprehensive financial analysis.',
    images: ['/og-image.jpg'],
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
  category: 'finance',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-IN">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#10b981" />
        <link rel="canonical" href="https://stock.incomegrow.in" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <QueryProvider>
            <div className="flex flex-col min-h-screen">
              <main className="flex-grow">
                {children}
              </main>
              <ConditionalFooter />
            </div>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}