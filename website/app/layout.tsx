import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '@/providers/QueryProvider';
import { configureApiClient } from '@/lib/api';

configureApiClient();

export const metadata: Metadata = {
  title: 'Noah Wallet - Your Web3 Gateway',
  description: 'A secure, user-friendly crypto wallet built for Web3. Manage your digital assets with confidence.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0d0d0d] text-white">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
