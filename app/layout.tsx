import type { Metadata } from 'next';
import { Noto_Sans_KR } from 'next/font/google';
import '@/styles/globals.css';
import Navbar from '@/components/Navbar';

const notoSans = Noto_Sans_KR({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: '경옥채 통합 관리 시스템',
  description: 'ERP/CRM/POS 통합 시스템',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={notoSans.className}>
        <Navbar />
        <div className="main-content">
          {children}
        </div>
      </body>
    </html>
  );
}