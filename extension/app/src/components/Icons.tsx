/* Thin inline SVG icon set for the wallet UI.
   All icons accept an optional `size` prop (default 20) and className. */
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const svg = (d: string, viewBox = "0 0 24 24") =>
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

export const ArrowLeft = svg("M19 12H5M12 19l-7-7 7-7");
export const Eye = svg("M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z");
export const EyeOff = svg(
  "M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22"
);
export const Upload = svg("M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12");
export const ClipboardPaste = svg(
  "M9 2h6a1 1 0 011 1v1H8V3a1 1 0 011-1zM3 6h18v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6z"
);
export const Copy = svg(
  "M20 9H11a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-9a2 2 0 00-2-2z M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"
);
export const QrCode = svg(
  "M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h3v3M18 21h3M21 18v3"
);
export const Send = svg("M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z");
export const ArrowUpRight = svg("M7 17L17 7M7 7h10v10");
export const ArrowDownLeft = svg("M17 7L7 17M17 17H7V7");
export const Swap = svg("M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4");
export const ChevronDown = svg("M6 9l6 6 6-6");
export const ChevronRight = svg("M9 18l6-6-6-6");
export const Settings = svg(
  "M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
);
export const BarChart2 = svg("M18 20V10M12 20V4M6 20v-6");
export const Activity = svg("M22 12h-4l-3 9L9 3l-3 9H2");
export const Wallet = svg(
  "M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z M16 13a1 1 0 100 2 1 1 0 000-2z M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"
);
export const Lock = svg(
  "M5 11V7a7 7 0 0114 0v4M3 11h18v11H3z M12 16a1 1 0 100 2 1 1 0 000-2z"
);
export const Search = svg("M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z");
export const MoreHorizontal = svg("M9 12h.01M12 12h.01M15 12h.01");
export const ExternalLink = svg(
  "M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6 M15 3h6v6 M10 14L21 3"
);

/* ─── Token brand marks ─────────────────────────────────────────────
   Full-color logo glyphs (not stroke-based like the icon set above) used
   for onboarding/marketing surfaces where a flat emoji glyph previously
   stood in for a real asset icon. */
type TokenIconProps = { size?: number; className?: string };

export function TokenBTC({ size = 24, className }: TokenIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
      <circle cx="16" cy="16" r="16" fill="#F7931A" />
      <path
        fill="#fff"
        d="M21.6 14.1c.3-1.9-1.2-2.9-3.2-3.6l.6-2.6-1.6-.4-.6 2.5c-.4-.1-.9-.2-1.3-.3l.6-2.5-1.6-.4-.6 2.6c-.4-.1-.7-.2-1.1-.3v-.01l-2.2-.55-.4 1.7s1.2.27 1.2.29c.65.16.77.6.75.94l-.75 3-.01 3.4c-.06.2-.24.5-.63.4.02.02-1.2-.3-1.2-.3l-.8 1.85 2.05.51c.38.1.75.19 1.12.29l-.61 2.6 1.6.4.6-2.6c.44.12.87.23 1.29.33l-.6 2.58 1.6.4.61-2.6c2.7.51 4.74.31 5.6-2.14.68-1.97-.03-3.11-1.46-3.85.99-.24 1.75-.9 1.94-2.34zm-3.66 5.1c-.5 1.97-3.72.9-4.78.64l.83-3.4c1.06.27 4.47.8 3.95 2.76zm.5-5.5c-.44 1.8-3.14.87-4.02.65l.75-3.05c.88.22 3.72.63 3.27 2.4z"
      />
    </svg>
  );
}

export function TokenUSDT({ size = 24, className }: TokenIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
      <circle cx="16" cy="16" r="16" fill="#26A17B" />
      <path
        fill="#fff"
        d="M17.9 17.4v-.01c-.11.01-.68.05-1.94.05-1.01 0-1.72-.03-1.97-.05v.02c-3.9-.17-6.81-.85-6.81-1.66 0-.81 2.91-1.49 6.81-1.66v2.65c.25.02.98.06 1.98.06 1.2 0 1.81-.05 1.92-.06v-2.64c3.89.17 6.79.85 6.79 1.65 0 .81-2.9 1.49-6.79 1.65zm0-3.6v-2.37h5.43V7.75H8.72v3.68h5.43v2.37c-4.41.2-7.73 1.06-7.73 2.09 0 1.03 3.32 1.89 7.73 2.1v7.51h3.75v-7.51c4.4-.2 7.72-1.07 7.72-2.1 0-1.03-3.32-1.89-7.72-2.09z"
      />
    </svg>
  );
}

export function TokenSOL({ size = 24, className }: TokenIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
      <defs>
        <linearGradient id="sol-grad" x1="4" y1="6" x2="28" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#9945FF" />
          <stop offset="1" stopColor="#14F195" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="16" fill="#111" />
      <g fill="url(#sol-grad)">
        <path d="M8.6 20.1a1 1 0 01.7-.3h14.3a.5.5 0 01.36.85l-2.9 2.9a1 1 0 01-.7.29H6.06a.5.5 0 01-.35-.85z" />
        <path d="M8.6 9.15A1 1 0 019.3 8.85h14.3a.5.5 0 01.36.85l-2.9 2.9a1 1 0 01-.7.3H6.06a.5.5 0 01-.35-.85z" />
        <path d="M23.4 14.6a1 1 0 00-.7-.3H8.4a.5.5 0 00-.36.85l2.9 2.9a1 1 0 00.7.3h14.3a.5.5 0 00.35-.85z" />
      </g>
    </svg>
  );
}

export function TokenBNB({ size = 24, className }: TokenIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
      <circle cx="16" cy="16" r="16" fill="#F0B90B" />
      <g fill="#fff">
        <path d="M16 6.5 19.6 10.1 16 13.7 12.4 10.1z" />
        <path d="M9.9 12.6 13.5 16.2 9.9 19.8 6.3 16.2z" />
        <path d="M22.1 12.6 25.7 16.2 22.1 19.8 18.5 16.2z" />
        <path d="M16 18.3 19.6 21.9 16 25.5 12.4 21.9z" />
        <path d="M16 14.4 18 16.2 16 18.1 14 16.2z" />
      </g>
    </svg>
  );
}
