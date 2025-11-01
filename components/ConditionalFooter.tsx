'use client';

import { usePathname } from 'next/navigation';
import Subscribe from './Subscribe';
import Footer from './Footer';

export default function ConditionalFooter() {
  const pathname = usePathname();

  // Hide footer on admin pages * and dashboard pages
  const isAdminPage = pathname?.startsWith('/admin');
  const isDashboardPage = pathname?.startsWith('/dashboard');
  const isScannerPage = pathname?.startsWith('/scanner');

  if (isScannerPage) {
    return null;
  }
  
  if (isDashboardPage) {
    return null;
  }

  if (isAdminPage) {
    return null;
  }

  return (
    <>
      <Subscribe />
      <Footer />
    </>
  );
}
