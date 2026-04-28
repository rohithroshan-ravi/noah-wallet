import { useState } from "react";
import { ArrowLeft, ChevronDown, Swap } from "../components/Icons";
import { useWalletStore } from "../store/walletStore";

type Props = { onBack: () => void };

export function SwapTab({ onBack }: Props) {
  const portfolio = useWalletStore((s) => s.portfolio);
  const [sellIdx, setSellIdx] = useState(0);
  const [buyIdx, setBuyIdx] = useState(1);
  const [sellAmt, setSellAmt] = useState("");

  const sellToken = portfolio[sellIdx];
  const buyToken = portfolio[buyIdx];

  return (
    <div className="flex min-h-screen flex-col bg-[#0d0d0d] px-5 pt-5">
      <button className="mb-6 self-start" onClick={onBack}>
        <ArrowLeft />
      </button>

      <h1 className="mb-6 text-xl font-extrabold text-white">Swap</h1>

      {/* Sell */}
      <div className="card px-4 py-4 space-y-2">
        <p className="text-xs text-[#888]">You Sell</p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-[#2a2a2a] px-3 py-1.5">
            <div className="h-5 w-5 rounded-full bg-[#444] flex items-center justify-center text-[10px] font-black text-white">
              {sellToken?.symbol?.slice(0, 1) ?? "?"}
            </div>
            <span className="text-sm font-semibold text-white">{sellToken?.symbol ?? "—"}</span>
            <ChevronDown size={12} className="text-[#888]" />
          </div>
          <input
            className="flex-1 bg-transparent text-right text-xl font-bold text-white outline-none placeholder-[#444]"
            placeholder="0.00"
            type="number"
            min="0"
            value={sellAmt}
            onChange={(e) => setSellAmt(e.target.value)}
          />
        </div>
        <p className="text-xs text-[#888] text-right">Balance: {sellToken?.balance ?? "—"}</p>
      </div>

      {/* Swap arrow */}
      <div className="flex justify-center py-2">
        <button
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1c1c1c] border border-[#2a2a2a] hover:border-[#c8ff00] transition"
          onClick={() => { const t = sellIdx; setSellIdx(buyIdx); setBuyIdx(t); }}
        >
          <Swap size={16} className="text-[#c8ff00]" />
        </button>
      </div>

      {/* Buy */}
      <div className="card px-4 py-4 space-y-2">
        <p className="text-xs text-[#888]">You Receive</p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-[#2a2a2a] px-3 py-1.5">
            <div className="h-5 w-5 rounded-full bg-[#444] flex items-center justify-center text-[10px] font-black text-white">
              {buyToken?.symbol?.slice(0, 1) ?? "?"}
            </div>
            <span className="text-sm font-semibold text-white">{buyToken?.symbol ?? "—"}</span>
            <ChevronDown size={12} className="text-[#888]" />
          </div>
          <span className="flex-1 text-right text-xl font-bold text-[#888]">—</span>
        </div>
      </div>

      {/* Pricing info */}
      <div className="mt-4 card px-4 py-3 text-xs text-[#888] space-y-1.5">
        <div className="flex justify-between">
          <span>Rate</span><span className="text-white">1 {sellToken?.symbol ?? "?"} ≈ — {buyToken?.symbol ?? "?"}</span>
        </div>
        <div className="flex justify-between">
          <span>Est. Network Fee</span><span className="text-white">—</span>
        </div>
        <div className="flex justify-between">
          <span>Price Impact</span><span className="text-white">&lt;0.1%</span>
        </div>
      </div>

      <div className="mt-auto pb-10 pt-6">
        <button className="btn-lime" disabled={!sellAmt}>
          Swap
        </button>
      </div>
    </div>
  );
}
