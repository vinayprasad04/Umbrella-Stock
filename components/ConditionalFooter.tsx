'use client';

import { usePathname } from 'next/navigation';
import Subscribe from './Subscribe';
import Footer from './Footer';

export default function ConditionalFooter() {
  const pathname = usePathname();

  // Hide footer on admin pages
  const isAdminPage = pathname?.startsWith('/admin');

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
