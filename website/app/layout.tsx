import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '@/providers/QueryProvider';
import { configureApiClient } from '@/lib/api';

configureApiClient();

export const metadata: Metadata = {
  title: 'Noah Wallet - Your Web3 Gateway',
  description: 'A secure, user-friendly crypto wallet built for Web3. Manage your digital assets with confidence.',
};

// Applies the persisted/system theme to <html> before first paint, so
// the page never flashes the wrong palette then swaps once React hydrates.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') {
      document.documentElement.setAttribute('data-theme', stored);
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="bg-[var(--bg)] text-[var(--text-1)]">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
