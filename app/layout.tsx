import { Inter } from 'next/font/google';
import QueryProvider from '@/lib/react-query';
import { AuthProvider } from '@/lib/AuthContext';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Umbrella Stock - Stock Market Tracker',
  description: 'Track stock prices, view market trends, and analyze your portfolio with real-time data.',
  keywords: 'stocks, market, finance, investment, portfolio',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <QueryProvider>
            {children}
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}