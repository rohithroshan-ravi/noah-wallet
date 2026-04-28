import { useEffect, useState } from "react";
import { useWalletStore } from "./store/walletStore";

import { WelcomePage } from "./pages/WelcomePage";
import { EnterPhrasePage } from "./pages/EnterPhrasePage";
import { ShowPhrasePage } from "./pages/ShowPhrasePage";
import { SetPasswordPage } from "./pages/SetPasswordPage";
import { UnlockPage } from "./pages/UnlockPage";
import { BalanceTab } from "./pages/BalanceTab";
import { ReceivePage } from "./pages/ReceivePage";
import { SendPage } from "./pages/SendPage";
import { SwapTab } from "./pages/SwapTab";
import { ActivityTab, ActivityDetailPage, type TxRecord } from "./pages/ActivityTab";
import { SettingsTab } from "./pages/SettingsTab";
import { BottomNav, type Tab } from "./components/BottomNav";

type Screen =
  | "welcome"
  | "enter-phrase"
  | "show-phrase"
  | "set-password-create"
  | "set-password-import"
  | "unlock"
  | "dashboard"
  | "receive"
  | "send"
  | "swap"
  | "activity-detail";

function DashboardShell() {
  const [tab, setTab] = useState<Tab>("balance");
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [detailTx, setDetailTx] = useState<TxRecord | null>(null);

  if (screen === "receive") return <ReceivePage onBack={() => setScreen("dashboard")} />;
  if (screen === "send") return <SendPage onBack={() => setScreen("dashboard")} />;
  if (screen === "swap") return <SwapTab onBack={() => setScreen("dashboard")} />;
  if (screen === "activity-detail" && detailTx)
    return <ActivityDetailPage tx={detailTx} onBack={() => setScreen("dashboard")} />;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {tab === "balance" && (
          <BalanceTab
            onReceive={() => setScreen("receive")}
            onSend={() => setScreen("send")}
            onSwap={() => setScreen("swap")}
          />
        )}
        {tab === "swap" && <SwapTab onBack={() => setTab("balance")} />}
        {tab === "activity" && (
          <ActivityTab
            onDetail={(tx) => {
              setDetailTx(tx);
              setScreen("activity-detail");
            }}
          />
        )}
        {tab === "settings" && (
          <SettingsTab onLock={() => { /* handled in store */ }} />
        )}
      </div>

      {/* Bottom nav */}
      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}

export default function App() {
  const init = useWalletStore((s) => s.init);
  const initialized = useWalletStore((s) => s.initialized);
  const wallet = useWalletStore((s) => s.wallet);
  const unlocked = useWalletStore((s) => s.unlocked);
  const generatedMnemonic = useWalletStore((s) => s.pendingSecret);

  const [screen, setScreen] = useState<Screen>("welcome");

  useEffect(() => { init(); }, [init]);

  useEffect(() => {
    if (!initialized) return;
    if (!wallet) { setScreen("welcome"); return; }
    if (!unlocked) { setScreen("unlock"); return; }
    setScreen("dashboard");
  }, [initialized, wallet, unlocked]);

  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d0d0d]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#c8ff00] border-t-transparent" />
      </div>
    );
  }

  if (screen === "welcome")
    return (
      <WelcomePage
        onGetStarted={() => setScreen("show-phrase")}
        onUseExisting={() => setScreen("enter-phrase")}
      />
    );

  if (screen === "enter-phrase")
    return (
      <EnterPhrasePage
        onBack={() => setScreen("welcome")}
        onContinue={() => setScreen("set-password-import")}
      />
    );

  if (screen === "show-phrase") {
    // If we don't yet have a generated mnemonic, we need to trigger wallet creation flow
    // ShowPhrasePage will display the mnemonic from the store's pendingSecret (set after createWallet)
    return (
      <ShowPhrasePage
        mnemonic={generatedMnemonic || "word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12"}
        onBack={() => setScreen("welcome")}
        onContinue={() => setScreen("set-password-create")}
      />
    );
  }

  if (screen === "set-password-create")
    return (
      <SetPasswordPage
        mode="create"
        onBack={() => setScreen("show-phrase")}
        onDone={() => setScreen("dashboard")}
      />
    );

  if (screen === "set-password-import")
    return (
      <SetPasswordPage
        mode="import-phrase"
        onBack={() => setScreen("enter-phrase")}
        onDone={() => setScreen("dashboard")}
      />
    );

  if (screen === "unlock")
    return <UnlockPage onUnlocked={() => setScreen("dashboard")} />;

  return <DashboardShell />;
}
