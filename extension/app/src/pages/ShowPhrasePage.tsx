import { useState } from "react";
import { ArrowLeft } from "../components/Icons";
import { useWalletStore } from "../store/walletStore";

type Props = {
  mnemonic: string;
  onContinue: () => void;
  onBack: () => void;
  onUseExisting: () => void;
};

export function ShowPhrasePage({ mnemonic, onContinue, onBack, onUseExisting }: Props) {
  const words = mnemonic.trim().split(/\s+/).filter(Boolean);
  const [saved, setSaved] = useState(false);

  return (
    <div className="panel-shell px-5 pt-5">
      <button className="mb-6 self-start" onClick={onBack}>
        <ArrowLeft />
      </button>

      <h1 className="mb-1 text-2xl font-extrabold text-white">Your 12-Word Recovery Phrase</h1>
      <p className="mb-5 text-sm text-[#888]">Keep this offline and never share with anyone.</p>

      {/* Tabs (decorative match) */}
      <div className="mb-4 flex w-24 rounded-xl bg-[#1c1c1c] border border-[#2a2a2a] p-0.5">
        {([12, 24] as const).map((n, i) => (
          <div
            key={n}
            className={`flex-1 rounded-lg py-1 text-center text-xs font-semibold ${
              i === 0 ? "bg-[#c8ff00] text-black" : "text-[#888]"
            }`}
          >
            {n}
          </div>
        ))}
      </div>

      {/* Word grid */}
      <div className="grid grid-cols-3 gap-2">
        {words.map((w, i) => (
          <div key={i} className="word-chip">
            <span className="idx">{i + 1}</span>
            <span className="text-xs font-medium">{w}</span>
          </div>
        ))}
      </div>

      <div className="mt-auto pb-10 pt-6 space-y-3">
        <button
          className={`btn-lime ${saved ? "opacity-80" : ""}`}
          onClick={() => { setSaved(true); onContinue(); }}
        >
          Saved Phrase
        </button>
        <button className="btn-ghost" onClick={onUseExisting}>
          Use Existing Wallet
        </button>
      </div>
    </div>
  );
}
