import { useState } from "react";
import { ArrowLeft, ChevronDown } from "../components/Icons";
import { useWalletStore } from "../store/walletStore";

type Props = { onBack: () => void };

export function SendPage({ onBack }: Props) {
  const sendNative = useWalletStore((s) => s.sendNative);
  const portfolio = useWalletStore((s) => s.portfolio);
  const loading = useWalletStore((s) => s.loading);
  const error = useWalletStore((s) => s.error);
  const txHash = useWalletStore((s) => s.lastTxHash);

  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);

  const token = portfolio[selectedIdx];

  const handleSend = async () => {
    if (!to || !amount) return;
    await sendNative(to, amount);
  };

  if (txHash) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0d0d0d] px-6 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#c8ff0020]">
          <span className="text-3xl text-[#c8ff00]">✓</span>
        </div>
        <h2 className="text-xl font-extrabold text-white">Transaction Sent!</h2>
        <p className="mt-2 break-all text-xs text-[#888]">{txHash}</p>
        <button className="btn-lime mt-10 w-full" onClick={onBack}>Done</button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0d0d0d] px-5 pt-5">
      <button className="mb-6 self-start" onClick={onBack}>
        <ArrowLeft />
      </button>

      <h1 className="mb-6 text-xl font-extrabold text-white">Send</h1>

      <div className="space-y-4">
        {/* Token selector */}
        <div className="card flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#222] text-sm font-black text-white">
              {token?.symbol?.slice(0, 1) ?? "?"}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{token?.symbol ?? "Select"}</p>
              <p className="text-xs text-[#888]">Balance: {token?.balance ?? "—"}</p>
            </div>
          </div>
          <ChevronDown size={16} className="text-[#888]" />
        </div>

        {/* To */}
        <div>
          <label className="mb-1.5 block text-xs text-[#888]">Recipient Address</label>
          <input
            className="field"
            placeholder="0x…"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>

        {/* Amount */}
        <div>
          <label className="mb-1.5 block text-xs text-[#888]">Amount</label>
          <div className="relative">
            <input
              className="field pr-14"
              placeholder="0.00"
              type="number"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-[#2a2a2a] px-2 py-0.5 text-[10px] font-bold text-[#c8ff00]"
              onClick={() => setAmount(token?.balance ?? "")}
            >
              MAX
            </button>
          </div>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>

      <div className="mt-auto pb-10 pt-8">
        <button
          className="btn-lime"
          disabled={!to || !amount || loading}
          onClick={handleSend}
        >
          {loading ? "Sending…" : "Send"}
        </button>
      </div>
    </div>
  );
}
