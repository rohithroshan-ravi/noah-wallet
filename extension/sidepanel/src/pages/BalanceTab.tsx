import { useEffect } from "react";
import { QrCode, ArrowUpRight, Swap, Lock, MoreHorizontal } from "../components/Icons";
import { useWalletStore } from "../store/walletStore";

type Props = {
  onReceive: () => void;
  onSend: () => void;
  onSwap: () => void;
};

export function BalanceTab({ onReceive, onSend, onSwap }: Props) {
  const account = useWalletStore((s) => s.account);
  const portfolio = useWalletStore((s) => s.portfolio);
  const lockWallet = useWalletStore((s) => s.lockWallet);
  const refreshPortfolio = useWalletStore((s) => s.refreshPortfolio);

  useEffect(() => { refreshPortfolio(); }, []);

  const shortAddr = account
    ? `${account.slice(0, 6)}…${account.slice(-4)}`
    : "";

  const totalUsd = portfolio.reduce((acc, t) => acc + (t.usdValue ?? 0), 0);

  return (
    <div className="flex flex-col pb-20">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#c8ff00] to-[#6bde00]">
          <span className="text-xs font-black text-black">N</span>
        </div>
        <div className="text-center">
          <p className="text-xs font-semibold text-white">Noah Wallet</p>
          <button
            className="flex items-center gap-1 text-[11px] text-[#888] hover:text-white transition"
            onClick={() => navigator.clipboard.writeText(account ?? "")}
          >
            {shortAddr}
            <span className="text-[10px]">⎘</span>
          </button>
        </div>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-full border border-[#2a2a2a] text-[#888] hover:text-red-400 transition"
          onClick={lockWallet}
          title="Lock wallet"
        >
          <Lock size={15} />
        </button>
      </div>

      {/* Balance */}
      <div className="mt-8 px-5 text-center">
        <p className="text-4xl font-extrabold tracking-tight text-white">
          ${totalUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className="mt-1 text-sm text-[#888]">Total Balance</p>
      </div>

      {/* Action row */}
      <div className="mt-8 flex justify-around px-3">
        <ActionBtn icon={<QrCode size={19} />} label="Receive" onClick={onReceive} />
        <ActionBtn icon={<span className="text-[16px] font-bold text-white">$</span>} label="Buy" onClick={() => {}} />
        <ActionBtn icon={<ArrowUpRight size={19} />} label="Send" onClick={onSend} />
        <ActionBtn icon={<Swap size={18} />} label="Swap" onClick={onSwap} />
        <ActionBtn icon={<MoreHorizontal size={19} />} label="More" onClick={() => {}} />
      </div>

      {/* Token list */}
      <div className="mt-8 space-y-1 px-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#555]">Tokens</p>
        {portfolio.length === 0 && (
          <div className="flex flex-col items-center py-10 text-center">
            <p className="text-sm text-[#555]">No tokens yet</p>
          </div>
        )}
        {portfolio.map((tok) => (
          <TokenRow key={tok.symbol} token={tok} />
        ))}
      </div>
    </div>
  );
}

function ActionBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button className="icon-btn" onClick={onClick}>
      <span className="icon-circle">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function TokenRow({ token }: { token: { symbol: string; name?: string; balance?: string; usdValue?: number; priceChange?: number } }) {
  const change = token.priceChange ?? 0;
  return (
    <div className="card flex items-center gap-3 px-4 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#222] text-base font-black text-white">
        {token.symbol.slice(0, 1)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{token.symbol}</p>
        <p className="text-xs text-[#888] truncate">{token.name ?? token.symbol}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-white">
          ${(token.usdValue ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <span className={change >= 0 ? "badge-positive" : "badge-negative"}>
          {change >= 0 ? "+" : ""}{change.toFixed(2)}%
        </span>
      </div>
    </div>
  );
}
