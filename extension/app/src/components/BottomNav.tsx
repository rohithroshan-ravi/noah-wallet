import { Wallet, Swap, Activity, Settings } from "./Icons";

export type Tab = "balance" | "swap" | "activity" | "settings";

type Props = { active: Tab; onChange: (t: Tab) => void };

const TABS: { id: Tab; label: string; Icon: React.ComponentType<{ size?: number }> }[] = [
  { id: "balance",  label: "Balance",  Icon: Wallet },
  { id: "swap",     label: "Swap",     Icon: Swap },
  { id: "activity", label: "Activity", Icon: Activity },
  { id: "settings", label: "Settings", Icon: Settings },
];

export function BottomNav({ active, onChange }: Props) {
  return (
    // Border/background already come from the `.panel-footer` wrapper this renders inside.
    <nav className="flex h-16">
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          className={`tab-item ${active === id ? "active" : ""}`}
          onClick={() => onChange(id)}
        >
          <Icon size={20} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
