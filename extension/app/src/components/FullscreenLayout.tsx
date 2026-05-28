import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export function FullscreenLayout({ children }: Props) {
  return (
    <div className="fullscreen-wrapper">
      {children}
    </div>
  );
}
