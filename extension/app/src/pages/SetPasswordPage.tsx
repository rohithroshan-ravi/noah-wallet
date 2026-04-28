import { useState } from "react";
import { ArrowLeft, Eye, EyeOff } from "../components/Icons";
import { useWalletStore } from "../store/walletStore";

type Props = {
  mode: "create" | "import-phrase" | "import-pk";
  onBack: () => void;
  onDone: () => void;
};

export function SetPasswordPage({ mode, onBack, onDone }: Props) {
  const createWallet = useWalletStore((s) => s.createWallet);
  const importWithMnemonic = useWalletStore((s) => s.importWithMnemonic);
  const importWithPrivateKey = useWalletStore((s) => s.importWithPrivateKey);
  const pendingSecret = useWalletStore((s) => s.pendingSecret);
  const loading = useWalletStore((s) => s.loading);
  const error = useWalletStore((s) => s.error);

  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const mismatch = confirm.length > 0 && pw !== confirm;
  const ready = pw.length >= 8 && pw === confirm;

  const handleContinue = async () => {
    if (!ready) return;
    if (mode === "create") await createWallet(pw);
    else if (mode === "import-phrase") await importWithMnemonic(pendingSecret, pw);
    else await importWithPrivateKey(pendingSecret, pw);
    if (!useWalletStore.getState().error) onDone();
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#0d0d0d] px-6 pt-5">
      <button className="mb-8 self-start" onClick={onBack}>
        <ArrowLeft />
      </button>

      <h1 className="mb-2 text-2xl font-extrabold text-white">
        Set a Password for<br />Your Wallet
      </h1>

      <div className="mt-8 space-y-3">
        <div className="relative">
          <input
            className="field pr-11"
            type={showPw ? "text" : "password"}
            placeholder="New Password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
          />
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555]"
            onClick={() => setShowPw(!showPw)}
            type="button"
          >
            {showPw ? <EyeOff /> : <Eye />}
          </button>
        </div>

        <div className="relative">
          <input
            className={`field pr-11 ${mismatch ? "border-red-500" : ""}`}
            type={showConfirm ? "text" : "password"}
            placeholder="Confirm Password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555]"
            onClick={() => setShowConfirm(!showConfirm)}
            type="button"
          >
            {showConfirm ? <EyeOff /> : <Eye />}
          </button>
        </div>

        {mismatch && <p className="text-xs text-red-400">Passwords don't match</p>}
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>

      <div className="mt-auto pb-10 pt-8">
        <button className="btn-lime" disabled={!ready || loading} onClick={handleContinue}>
          {loading ? "Setting up…" : "Continue"}
        </button>
        <button className="btn-ghost mt-2" onClick={onBack}>
          Use Existing Wallet
        </button>
      </div>
    </div>
  );
}
