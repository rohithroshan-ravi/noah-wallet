import { useEffect } from "react";
import { useWalletStore } from "./store/walletStore";
import { useAuthRedirect } from "./hooks/useAuthRedirect";
import { AppRoutes } from "./routes/AppRoutes";

export default function App() {
  const init = useWalletStore((s) => s.init);
  const initialized = useWalletStore((s) => s.initialized);
  const wallet = useWalletStore((s) => s.wallet);
  const unlocked = useWalletStore((s) => s.unlocked);
  const generatedMnemonic = useWalletStore((s) => s.pendingSecret);
  const setPendingSecret = useWalletStore((s) => s.setPendingSecret);

  useEffect(() => {
    void init();
  }, [init]);

  useAuthRedirect({ initialized, wallet, unlocked });

  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d0d0d]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#c8ff00] border-t-transparent" />
      </div>
    );
  }

  return <AppRoutes generatedMnemonic={generatedMnemonic} setPendingSecret={setPendingSecret} />;
}
