/* Thin inline SVG icon set for the marketing site — mirrors the wallet
   extension's icon set so both surfaces share the same visual language
   instead of leaning on emoji glyphs. */
import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const svg = (d: string, viewBox = '0 0 24 24') =>
  ({ size = 20, className, ...rest }: IconProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >
      <path d={d} />
    </svg>
  );

export const Rocket = svg(
  'M12 2c2.5 2.5 4 6 4 10 0 1.5-.3 2.7-.7 3.7M12 2c-2.5 2.5-4 6-4 10 0 1.5.3 2.7.7 3.7M9 15l-4 4M15 15l4 4M12 2a4 4 0 014 4 4 4 0 01-4 4 4 4 0 01-4-4 4 4 0 014-4z'
);
export const Lock = svg(
  'M5 11V7a7 7 0 0114 0v4M3 11h18v11H3z M12 16a1 1 0 100 2 1 1 0 000-2z'
);
export const Globe = svg(
  'M12 22a10 10 0 100-20 10 10 0 000 20z M2 12h20M12 2a15 15 0 010 20M12 2a15 15 0 000 20'
);
export const Zap = svg('M13 2 3 14h9l-1 8 10-12h-9l1-8z');
export const Target = svg(
  'M12 22a10 10 0 100-20 10 10 0 000 20z M12 17a5 5 0 100-10 5 5 0 000 10z M12 13a1 1 0 100-2 1 1 0 000 2z'
);
export const Smartphone = svg(
  'M7 2h10a2 2 0 012 2v16a2 2 0 01-2 2H7a2 2 0 01-2-2V4a2 2 0 012-2z M11 18h2'
);
export const Shield = svg('M12 2 4 5v6c0 5 4 8.5 8 11 4-2.5 8-6 8-11V5z');
export const Download = svg('M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12');
export const Github = svg(
  'M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 00-1.3-3.2 4.2 4.2 0 00-.1-3.2s-1.3-.4-4.1 1.6a13.4 13.4 0 00-7 0C4.9 2.7 3.6 3.1 3.6 3.1a4.2 4.2 0 00-.1 3.2A4.6 4.6 0 002.2 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21'
);
export const Sun = svg(
  'M12 17a5 5 0 100-10 5 5 0 000 10z M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42'
);
export const Moon = svg('M21 12.8A9 9 0 1111.2 3a7 7 0 109.8 9.8z');

type BrandIconProps = { size?: number; className?: string };

/* Full-color brand marks — used where a plain emoji ("🚀", "📥", "🦊") was
   previously standing in for a real graphic. */
export function ChromeLogo({ size = 20, className }: BrandIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
      <circle cx="16" cy="16" r="16" fill="#fff" />
      <path fill="#EA4335" d="M16 8h13.86A16 16 0 0016 0a16 16 0 00-13.86 8H16z" />
      <path fill="#4285F4" d="M23.93 16a7.93 7.93 0 01-7.93 7.93 8 8 0 01-6.87-3.93l-6.9 11.96A16 16 0 0016 32a16 16 0 0013.86-8L21.93 12A7.9 7.9 0 0123.93 16z" />
      <path fill="#34A853" d="M9.07 16a7.93 7.93 0 013.13-6.32L2.14 8A16 16 0 000 16a16 16 0 002.14 8l6.93-12A7.9 7.9 0 019.07 16z" />
      <circle cx="16" cy="16" r="6.2" fill="#fff" />
      <circle cx="16" cy="16" r="5" fill="#4285F4" />
    </svg>
  );
}

export function FirefoxLogo({ size = 20, className }: BrandIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
      <defs>
        <linearGradient id="ff-grad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFE900" />
          <stop offset="0.5" stopColor="#FF7A00" />
          <stop offset="1" stopColor="#E31587" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="16" fill="url(#ff-grad)" />
      <path
        fill="#fff"
        fillOpacity="0.9"
        d="M22.5 11.5c-1-2.2-2.9-3.9-5.2-4.7a7 7 0 015 2c-1.7-.3-2.7.4-2.7 1 0 .8 2.6.6 3.6 3.5.9 2.6-.2 5-.2 5s.6-2.6-1-4c-1.8-1.6-3.8-.4-3.6 1.4.2 1.8 2 2.1 2 3.4 0 2.6-3 4.6-6.4 4.6-4.4 0-8-3.4-8-8.4 0-2.5 1-4.4 2.2-5.7-.4 1.2-.5 2.8.2 3.6.6-2.6 2.6-4.7 4.7-5.6-.6.9-.9 2-.7 2.9 1.3-2 3.7-3 5.7-2.4a6.6 6.6 0 013.4 3.4z"
      />
    </svg>
  );
}
