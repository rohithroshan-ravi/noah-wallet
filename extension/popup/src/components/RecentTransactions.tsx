import { useWalletStore } from "../store/walletStore";

export function RecentTransactions() {
  const transactions = useWalletStore((s) => s.transactions);

  return (
    <div className="card space-y-2">
      <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">Recent Transactions</h2>
      <ul className="space-y-2 text-xs">
        {transactions.slice(0, 6).map((tx) => (
          <li key={tx.hash} className="rounded-xl border border-slate-200 p-2 dark:border-slate-700">
            <p className="font-semibold text-slate-700 dark:text-slate-200">{tx.hash.slice(0, 12)}...</p>
            <p className="text-slate-500 dark:text-slate-400">
              {tx.status || "pending"} | {new Date(tx.timestamp).toLocaleString()}
            </p>
          </li>
        ))}
        {!transactions.length && <p className="text-slate-500 dark:text-slate-400">No transactions yet.</p>}
      </ul>
    </div>
  );
}
