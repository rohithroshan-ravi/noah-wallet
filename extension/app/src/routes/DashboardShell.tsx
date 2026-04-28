import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { BottomNav, type Tab } from "../components/BottomNav";
import { ActivityTab } from "../pages/ActivityTab";
import { BalanceTab } from "../pages/BalanceTab";
import { ReceivePage } from "../pages/ReceivePage";
import { SendPage } from "../pages/SendPage";
import { SettingsTab } from "../pages/SettingsTab";
import { SwapTab } from "../pages/SwapTab";
import { ActivityDetailRoute } from "./ActivityDetailRoute";
import { SidepanelLayout } from "../components/SidepanelLayout";
import { ROUTES } from "./paths";

export function DashboardShell() {
  const navigate = useNavigate();
  const location = useLocation();

  const tab: Tab = location.pathname.startsWith(ROUTES.dashboardSwap)
    ? "swap"
    : location.pathname.startsWith(ROUTES.dashboardActivity)
      ? "activity"
      : location.pathname.startsWith(ROUTES.dashboardSettings)
        ? "settings"
        : "balance";

  return (
    <SidepanelLayout
      bottomNav={
        <BottomNav
          active={tab}
          onChange={(nextTab) => {
            const nextPath = nextTab === "balance"
              ? ROUTES.dashboardBalance
              : nextTab === "swap"
                ? ROUTES.dashboardSwap
                : nextTab === "activity"
                  ? ROUTES.dashboardActivity
                  : ROUTES.dashboardSettings;
            navigate(nextPath);
          }}
        />
      }
    >
      <Routes>
        <Route
          path="balance"
          element={
            <BalanceTab
              onReceive={() => navigate(ROUTES.dashboardReceive)}
              onSend={() => navigate(ROUTES.dashboardSend)}
              onSwap={() => navigate(ROUTES.dashboardSwap)}
            />
          }
        />
        <Route path="receive" element={<ReceivePage onBack={() => navigate(ROUTES.dashboardBalance)} />} />
        <Route path="send" element={<SendPage onBack={() => navigate(ROUTES.dashboardBalance)} />} />
        <Route path="swap" element={<SwapTab onBack={() => navigate(ROUTES.dashboardBalance)} />} />
        <Route
          path="activity"
          element={<ActivityTab onDetail={(tx) => navigate(`${ROUTES.dashboardActivity}/${tx.hash}`)} />}
        />
        <Route path="activity/:hash" element={<ActivityDetailRoute />} />
        <Route path="settings" element={<SettingsTab onLock={() => navigate(ROUTES.unlock)} />} />
        <Route path="*" element={<Navigate to={ROUTES.dashboardBalance} replace />} />
      </Routes>
    </SidepanelLayout>
  );
}
