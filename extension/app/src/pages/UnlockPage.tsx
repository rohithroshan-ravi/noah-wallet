import { useState } from "react";
import { Eye, EyeOff } from "../components/Icons";
import { useWalletStore } from "../store/walletStore";

type Props = { onUnlocked: () => void };

export function UnlockPage({ onUnlocked }: Props) {
  const unlockWallet = useWalletStore((s) => s.unlockWallet);
  const loading = useWalletStore((s) => s.loading);
  const error = useWalletStore((s) => s.error);

  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);

  const handleUnlock = async () => {
    await unlockWallet(pw);
    if (!useWalletStore.getState().error) onUnlocked();
  };

  return (
    <div className="panel-shell items-center justify-center px-6">
      {/* Logo */}
      <img src="/icons/logo-white.svg" alt="Noah Wallet" className="mb-3 h-14 w-14" />
      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[#c8ff00]">Noah Wallet</p>

      <h1 className="mb-1 mt-6 text-2xl font-extrabold text-white">Unlock Your Wallet</h1>
      <p className="mb-8 text-center text-sm text-[#888]">
        Enter your wallet and access your funds safely.
      </p>

      <div className="w-full space-y-4">
        <div className="relative">
          <input
            className="field pr-11"
            type={show ? "text" : "password"}
            placeholder="Enter your password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
          />
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555]"
            onClick={() => setShow(!show)}
            type="button"
          >
            {show ? <EyeOff /> : <Eye />}
          </button>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button className="btn-lime" onClick={handleUnlock} disabled={!pw || loading}>
          {loading ? "Unlocking…" : "Unlock"}
        </button>
      </div>

      <button className="mt-8 text-xs text-[#888] hover:text-white transition">
        Forgot Password
      </button>
    </div>
  );
}
