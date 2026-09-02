'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from './icons';

type Theme = 'light' | 'dark';

function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeToggle() {
  // null until mounted — avoids rendering a guess that mismatches the
  // inline script's pre-hydration choice (see app/layout.tsx).
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem('theme') as Theme | null;
    setTheme(stored ?? getSystemTheme());
  }, []);

  function toggle() {
    const next: Theme = (theme ?? getSystemTheme()) === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    window.localStorage.setItem('theme', next);
    setTheme(next);
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle light and dark theme"
      className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-2)] hover:text-[var(--text-1)] hover:border-[var(--accent-text)] transition"
    >
      {/* Render nothing theme-specific until mounted, so server and client markup match. */}
      {theme === 'light' ? <Moon size={16} /> : theme === 'dark' ? <Sun size={16} /> : <span className="h-4 w-4" />}
    </button>
  );
}
