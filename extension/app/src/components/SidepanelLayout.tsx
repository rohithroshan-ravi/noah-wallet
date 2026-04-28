import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  bottomNav?: ReactNode;
};

export function SidepanelLayout({ children, bottomNav }: Props) {
  return (
    <div className="panel-shell">
      <main className="panel-content">{children}</main>
      {bottomNav ? <footer className="panel-footer">{bottomNav}</footer> : null}
    </div>
  );
}
