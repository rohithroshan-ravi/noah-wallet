import { useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, ExternalLink } from "../components/Icons";
import { useWalletStore } from "../store/walletStore";

type Props = { onDetail: (tx: TxRecord) => void };

export type TxRecord = {
  hash: string;
  from: string;
  to: string;
  value: string;
  symbol: string;
  direction: "in" | "out";
  date: string; // ISO
  status: "success" | "failed" | "pending";
};

function dateLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ActivityTab({ onDetail }: Props) {
  const txHistory = useWalletStore((s) => s.txHistory ?? []);
  const refreshTxHistory = useWalletStore((s) => s.refreshTxHistory);

  useEffect(() => { refreshTxHistory?.(); }, []);

  // Group by date
  const groups = txHistory.reduce<Record<string, TxRecord[]>>((acc, tx) => {
    const label = dateLabel(tx.date ?? new Date().toISOString());
    (acc[label] ??= []).push(tx as TxRecord);
    return acc;
  }, {});

  if (txHistory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center pb-24">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#1c1c1c]">
          <ArrowUpRight size={22} className="text-[#555]" />
        </div>
        <p className="text-sm text-[#555]">No transactions yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-20">
      <div className="px-5 pt-5">
        <h1 className="text-xl font-extrabold text-white">Activity</h1>
      </div>
      {Object.entries(groups).map(([label, txs]) => (
        <div key={label} className="mt-5">
          <p className="mb-2 px-5 text-xs font-semibold text-[#555] uppercase tracking-wider">{label}</p>
          <div className="space-y-1 px-4">
            {txs.map((tx) => (
              <button
                key={tx.hash}
                className="card flex w-full items-center gap-3 px-4 py-3 text-left hover:border-[#c8ff00] transition"
                onClick={() => onDetail(tx)}
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tx.direction === "in" ? "bg-[#4ade8020] text-[#4ade80]" : "bg-[#ff4d4d20] text-[#ff4d4d]"}`}>
                  {tx.direction === "in" ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">
                    {tx.direction === "in" ? "Received" : "Sent"} {tx.symbol}
                  </p>
                  <p className="text-xs text-[#888] truncate">
                    {tx.direction === "in" ? "From" : "To"}: {tx.direction === "in" ? tx.from : tx.to}
                  </p>
                </div>
                <span className={`text-sm font-semibold ${tx.direction === "in" ? "text-[#4ade80]" : "text-white"}`}>
                  {tx.direction === "in" ? "+" : "-"}{tx.value} {tx.symbol}
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

type DetailProps = { tx: TxRecord; onBack: () => void };

export function ActivityDetailPage({ tx, onBack }: DetailProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[#0d0d0d] px-5 pt-5">
      <button className="mb-6 self-start" onClick={onBack}>
        <ArrowLeft />
      </button>

      <h1 className="mb-6 text-xl font-extrabold text-white">Transaction Details</h1>

      <div className="card divide-y divide-[#2a2a2a]">
        <Row label="Date" value={new Date(tx.date).toLocaleString()} />
        <Row label="Type" value={tx.direction === "in" ? "Received" : "Sent"} />
        <Row label="Amount" value={`${tx.value} ${tx.symbol}`} />
        <Row label="From" value={tx.from} small />
        <Row label="To" value={tx.to} small />
        <Row
          label="Status"
          value={tx.status}
          valueClass={tx.status === "success" ? "text-[#4ade80]" : tx.status === "failed" ? "text-red-400" : "text-yellow-400"}
        />
        <Row label="Tx Hash" value={tx.hash} small />
      </div>

      <div className="mt-auto pb-10 pt-8">
        <a
          href={`https://etherscan.io/tx/${tx.hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-lime flex items-center justify-center gap-2"
        >
          <ExternalLink size={15} />
          View on Explorer
        </a>
      </div>
    </div>
  );
}

function Row({ label, value, small, valueClass = "text-white" }: { label: string; value: string; small?: boolean; valueClass?: string }) {
  return (
    <div className="flex justify-between gap-4 px-4 py-3">
      <span className="shrink-0 text-xs text-[#888]">{label}</span>
      <span className={`text-right text-xs font-medium ${small ? "truncate max-w-[160px]" : ""} ${valueClass}`}>{value}</span>
    </div>
  );
}
