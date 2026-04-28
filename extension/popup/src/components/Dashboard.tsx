import { QRCodeSVG } from "qrcode.react";
import { useEffect } from "react";
import { NetworkSelector } from "./NetworkSelector";
import { RecentTransactions } from "./RecentTransactions";
import { SendForm } from "./SendForm";
import { useWalletStore } from "../store/walletStore";
import { DEFAULT_NETWORKS } from "../../../src/shared/networks";

export function Dashboard() {
  const wallet = useWalletStore((s) => s.wallet);
  const darkMode = useWalletStore((s) => s.darkMode);
  const activeChainId = useWalletStore((s) => s.activeChainId);
  const customNetworks = useWalletStore((s) => s.customNetworks);
  const nativeBalance = useWalletStore((s) => s.nativeBalance);
  const nativeUsdValue = useWalletStore((s) => s.nativeUsdValue);
  const tokenBalances = useWalletStore((s) => s.tokenBalances);
  const lockWallet = useWalletStore((s) => s.lockWallet);
  const setDarkMode = useWalletStore((s) => s.setDarkMode);
  const refreshPortfolio = useWalletStore((s) => s.refreshPortfolio);

  useEffect(() => {
    void refreshPortfolio();
  }, [activeChainId, refreshPortfolio]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const network = ({ ...DEFAULT_NETWORKS, ...customNetworks })[activeChainId];

  return (
    <div className="space-y-3 p-3">
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">Noah Wallet</h1>
          <button className="btn-muted" onClick={() => void setDarkMode(!darkMode)}>
            {darkMode ? "Light" : "Dark"}
          </button>
        </div>

        <NetworkSelector />

        <div className="rounded-2xl bg-ink p-3 text-white dark:bg-slate-800">
          <p className="text-xs text-mist">Address</p>
          <p className="truncate text-sm font-semibold">{wallet?.address}</p>
          <button
            className="mt-2 rounded-lg bg-white/20 px-2 py-1 text-xs"
            onClick={() => navigator.clipboard.writeText(wallet?.address || "")}
          >
            Copy Address
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Balance</p>
            <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
              {nativeBalance} {network?.nativeCurrency.symbol}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">${nativeUsdValue.toFixed(2)}</p>
          </div>
          {wallet?.address && <QRCodeSVG value={wallet.address} size={70} />}
        </div>

        <button className="btn-muted" onClick={() => void lockWallet()}>
          Lock Wallet
        </button>
      </div>

      <div className="card space-y-2">
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">Token Balances</h2>
        <ul className="space-y-1 text-xs">
          {tokenBalances.map((token) => (
            <li key={token.tokenAddress} className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 dark:text-slate-200">{token.symbol}</span>
              <span className="text-slate-600 dark:text-slate-300">{token.balance}</span>
            </li>
          ))}
          {!tokenBalances.length && <p className="text-slate-500 dark:text-slate-400">No ERC20 tokens found.</p>}
        </ul>
      </div>

      <SendForm />
      <RecentTransactions />
    </div>
  );
}
