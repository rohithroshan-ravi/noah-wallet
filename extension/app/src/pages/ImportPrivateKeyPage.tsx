import { useState } from "react";
import { ArrowLeft } from "../components/Icons";
import { useWalletStore } from "../store/walletStore";

type Props = {
  onBack: () => void;
  onContinue: () => void;
};

export function ImportPrivateKeyPage({ onBack, onContinue }: Props) {
  const setPendingSecret = useWalletStore((s) => s.setPendingSecret);
  const [privateKey, setPrivateKey] = useState("");

  const normalized = privateKey.trim();
  const ready = /^0x[a-fA-F0-9]{64}$/.test(normalized);

  const handleContinue = () => {
    if (!ready) return;
    setPendingSecret(normalized);
    onContinue();
  };

  return (
    <div className="panel-shell px-5 pt-5">
      <button className="mb-6 self-start" onClick={onBack}>
        <ArrowLeft />
      </button>

      <h1 className="mb-1 text-2xl font-extrabold text-white">Import Private Key</h1>
      <p className="mb-5 text-sm text-[#888]">
        Paste your private key to import your wallet.
      </p>

      <div className="space-y-2">
        <label className="text-xs text-[#888]">Private Key</label>
        <textarea
          className="field min-h-[120px]"
          placeholder="0x..."
          value={privateKey}
          onChange={(e) => setPrivateKey(e.target.value)}
        />
        {normalized.length > 0 && !ready && (
          <p className="text-xs text-red-400">Enter a valid 0x-prefixed 64-byte private key.</p>
        )}
      </div>

      <div className="mt-auto pb-10 pt-6">
        <button className="btn-lime" disabled={!ready} onClick={handleContinue}>
          Continue
        </button>
        <button className="btn-ghost mt-2" onClick={onBack}>
          Use Recovery Phrase
        </button>
      </div>
    </div>
  );
}
