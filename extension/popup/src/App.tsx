import { useEffect } from "react";
import { AuthGate } from "./components/AuthGate";
import { Dashboard } from "./components/Dashboard";
import { useAutoLock } from "./hooks/useAutoLock";
import { useWalletStore } from "./store/walletStore";

export default function App() {
  const initialized = useWalletStore((s) => s.initialized);
  const unlocked = useWalletStore((s) => s.unlocked);
  const init = useWalletStore((s) => s.init);

  useAutoLock();

  useEffect(() => {
    void init();
  }, [init]);

  if (!initialized) {
    return <div className="p-4 text-sm text-slate-700 dark:text-slate-200">Loading wallet...</div>;
  }

  return unlocked ? <Dashboard /> : <AuthGate />;
}
