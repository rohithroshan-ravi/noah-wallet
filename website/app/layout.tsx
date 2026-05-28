import type { Metadata } from 'next';
import './globals.css';

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
      <body className="bg-[#0d0d0d] text-white">{children}</body>
    </html>
  );
}
