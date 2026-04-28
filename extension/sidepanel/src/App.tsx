import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
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

function DashboardShell() {
  const navigate = useNavigate();
  const location = useLocation();

  const tab: Tab = location.pathname.startsWith("/dashboard/swap")
    ? "swap"
    : location.pathname.startsWith("/dashboard/activity")
      ? "activity"
      : location.pathname.startsWith("/dashboard/settings")
        ? "settings"
        : "balance";

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1 overflow-y-auto">
        <Routes>
          <Route
            path="balance"
            element={
              <BalanceTab
                onReceive={() => navigate("/dashboard/receive")}
                onSend={() => navigate("/dashboard/send")}
                onSwap={() => navigate("/dashboard/swap")}
              />
            }
          />
          <Route
            path="receive"
            element={<ReceivePage onBack={() => navigate("/dashboard/balance")} />}
          />
          <Route
            path="send"
            element={<SendPage onBack={() => navigate("/dashboard/balance")} />}
          />
          <Route
            path="swap"
            element={<SwapTab onBack={() => navigate("/dashboard/balance")} />}
          />
          <Route
            path="activity"
            element={
              <ActivityTab
                onDetail={(tx) => navigate(`/dashboard/activity/${tx.hash}`)}
              />
            }
          />
          <Route
            path="activity/:hash"
            element={<ActivityDetailRoute />}
          />
          <Route
            path="settings"
            element={<SettingsTab onLock={() => navigate("/unlock")} />}
          />
          <Route path="*" element={<Navigate to="/dashboard/balance" replace />} />
        </Routes>
      </div>

      <BottomNav
        active={tab}
        onChange={(nextTab) => {
          const nextPath = nextTab === "balance"
            ? "/dashboard/balance"
            : nextTab === "swap"
              ? "/dashboard/swap"
              : nextTab === "activity"
                ? "/dashboard/activity"
                : "/dashboard/settings";
          navigate(nextPath);
        }}
      />
    </div>
  );
}

function ActivityDetailRoute() {
  const { hash } = useParams();
  const navigate = useNavigate();
  const txHistory = useWalletStore((s) => s.txHistory);
  const tx = txHistory.find((item) => item.hash === hash) as TxRecord | undefined;

  if (!tx) {
    return <Navigate to="/dashboard/activity" replace />;
  }

  return <ActivityDetailPage tx={tx} onBack={() => navigate("/dashboard/activity")} />;
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const init = useWalletStore((s) => s.init);
  const initialized = useWalletStore((s) => s.initialized);
  const wallet = useWalletStore((s) => s.wallet);
  const unlocked = useWalletStore((s) => s.unlocked);
  const generatedMnemonic = useWalletStore((s) => s.pendingSecret);
  const setPendingSecret = useWalletStore((s) => s.setPendingSecret);

  useEffect(() => {
    void init();
  }, [init]);

  useEffect(() => {
    if (!initialized) return;

    const path = location.pathname;
    const onboardingPath =
      path === "/welcome" ||
      path === "/import/recovery" ||
      path === "/onboarding/recovery" ||
      path === "/onboarding/password" ||
      path === "/import/password";

    if (!wallet && !onboardingPath) {
      navigate("/welcome", { replace: true });
      return;
    }

    if (wallet && !unlocked && path !== "/unlock") {
      navigate("/unlock", { replace: true });
      return;
    }

    if (wallet && unlocked && (path === "/" || path === "/unlock" || path === "/welcome" || path === "/dashboard")) {
      navigate("/dashboard/balance", { replace: true });
    }
  }, [initialized, wallet, unlocked, location.pathname, navigate]);

  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d0d0d]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#c8ff00] border-t-transparent" />
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/welcome"
        element={
          <WelcomePage
            onGetStarted={() => {
              const mnemonic = ethers.Wallet.createRandom().mnemonic?.phrase ?? "";
              setPendingSecret(mnemonic);
              navigate("/onboarding/recovery");
            }}
            onUseExisting={() => navigate("/import/recovery")}
          />
        }
      />
      <Route
        path="/import/recovery"
        element={
          <EnterPhrasePage
            onBack={() => navigate("/welcome")}
            onContinue={() => navigate("/import/password")}
          />
        }
      />
      <Route
        path="/onboarding/recovery"
        element={
          <ShowPhrasePage
            mnemonic={generatedMnemonic}
            onBack={() => navigate("/welcome")}
            onContinue={() => navigate("/onboarding/password")}
            onUseExisting={() => navigate("/import/recovery")}
          />
        }
      />
      <Route
        path="/onboarding/password"
        element={
          <SetPasswordPage
            mode="create"
            onBack={() => navigate("/onboarding/recovery")}
            onDone={() => navigate("/dashboard/balance")}
          />
        }
      />
      <Route
        path="/import/password"
        element={
          <SetPasswordPage
            mode="import-phrase"
            onBack={() => navigate("/import/recovery")}
            onDone={() => navigate("/dashboard/balance")}
          />
        }
      />
      <Route path="/unlock" element={<UnlockPage onUnlocked={() => navigate("/dashboard/balance")} />} />
      <Route path="/dashboard/*" element={<DashboardShell />} />
      <Route path="*" element={<Navigate to="/welcome" replace />} />
    </Routes>
  );
}
