import { useState } from "react";
import { useWalletStore } from "../store/walletStore";
import { ChevronRight, Lock, ExternalLink } from "../components/Icons";

type Props = { onLock: () => void };

export function SettingsTab({ onLock }: Props) {
  const account = useWalletStore((s) => s.account) ?? "";
  const chainId = useWalletStore((s) => s.chainId);
  const lockWallet = useWalletStore((s) => s.lockWallet);

  return (
    <div className="flex flex-col pb-20 px-5 pt-5">
      <h1 className="mb-6 text-xl font-extrabold text-white">Settings</h1>

      {/* Wallet card */}
      <div className="card mb-6 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#c8ff00] to-[#6bde00]">
            <span className="text-sm font-black text-black">N</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Noah Wallet</p>
            <p className="text-[11px] break-all text-[#888]">{account}</p>
          </div>
        </div>
      </div>

      {/* Sections */}
      <Section title="Network">
        <SettingRow label="Active Network" value={`Chain ${chainId}`} />
      </Section>

      <Section title="Security">
        <SettingRow label="Reveal Recovery Phrase" />
        <SettingRow label="Change Password" />
        <SettingRow label="Auto-Lock Timeout" value="5 min" />
      </Section>

      <Section title="About">
        <SettingRow label="Version" value="0.1.0" />
        <SettingRow label="Terms of Service" />
        <SettingRow label="Privacy Policy" />
      </Section>

      {/* Lock */}
      <button
        className="mt-4 flex items-center justify-center gap-2 rounded-full border border-red-500/40 py-3 text-sm font-semibold text-red-400 hover:bg-red-500/10 transition"
        onClick={() => { lockWallet(); onLock(); }}
      >
        <Lock size={15} />
        Lock Wallet
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#555]">{title}</p>
      <div className="card divide-y divide-[#2a2a2a]">{children}</div>
    </div>
  );
}

function SettingRow({ label, value }: { label: string; value?: string }) {
  return (
    <button className="flex w-full items-center justify-between px-4 py-3 hover:bg-white/5 transition">
      <span className="text-sm text-white">{label}</span>
      <div className="flex items-center gap-1.5 text-[#888]">
        {value && <span className="text-xs">{value}</span>}
        <ChevronRight size={14} />
      </div>
    </button>
  );
}
