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
