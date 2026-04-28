import { ethers } from "ethers";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { EnterPhrasePage } from "../pages/EnterPhrasePage";
import { ImportPrivateKeyPage } from "../pages/ImportPrivateKeyPage";
import { SetPasswordPage } from "../pages/SetPasswordPage";
import { ShowPhrasePage } from "../pages/ShowPhrasePage";
import { UnlockPage } from "../pages/UnlockPage";
import { WelcomePage } from "../pages/WelcomePage";
import { DashboardShell } from "./DashboardShell";
import { ROUTES } from "./paths";

type Props = {
  generatedMnemonic: string;
  setPendingSecret: (secret: string) => void;
};

export function AppRoutes({ generatedMnemonic, setPendingSecret }: Props) {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route
        path={ROUTES.welcome}
        element={
          <WelcomePage
            onGetStarted={() => {
              const mnemonic = ethers.Wallet.createRandom().mnemonic?.phrase ?? "";
              setPendingSecret(mnemonic);
              navigate(ROUTES.onboardingRecovery);
            }}
            onUseExisting={() => navigate(ROUTES.importRecovery)}
          />
        }
      />
      <Route
        path={ROUTES.importRecovery}
        element={
          <EnterPhrasePage
            onBack={() => navigate(ROUTES.welcome)}
            onContinue={() => navigate(ROUTES.importPassword)}
            onImportPrivateKey={() => navigate(ROUTES.importPrivateKey)}
          />
        }
      />
      <Route
        path={ROUTES.importPrivateKey}
        element={
          <ImportPrivateKeyPage
            onBack={() => navigate(ROUTES.importRecovery)}
            onContinue={() => navigate(ROUTES.importPrivateKeyPassword)}
          />
        }
      />
      <Route
        path={ROUTES.onboardingRecovery}
        element={
          <ShowPhrasePage
            mnemonic={generatedMnemonic}
            onBack={() => navigate(ROUTES.welcome)}
            onContinue={() => navigate(ROUTES.onboardingPassword)}
            onUseExisting={() => navigate(ROUTES.importRecovery)}
          />
        }
      />
      <Route
        path={ROUTES.onboardingPassword}
        element={
          <SetPasswordPage
            mode="create"
            onBack={() => navigate(ROUTES.onboardingRecovery)}
            onDone={() => navigate(ROUTES.dashboardBalance)}
          />
        }
      />
      <Route
        path={ROUTES.importPassword}
        element={
          <SetPasswordPage
            mode="import-phrase"
            onBack={() => navigate(ROUTES.importRecovery)}
            onDone={() => navigate(ROUTES.dashboardBalance)}
          />
        }
      />
      <Route
        path={ROUTES.importPrivateKeyPassword}
        element={
          <SetPasswordPage
            mode="import-pk"
            onBack={() => navigate(ROUTES.importPrivateKey)}
            onDone={() => navigate(ROUTES.dashboardBalance)}
          />
        }
      />
      <Route path={ROUTES.unlock} element={<UnlockPage onUnlocked={() => navigate(ROUTES.dashboardBalance)} />} />
      <Route path="/dashboard/*" element={<DashboardShell />} />
      <Route path="*" element={<Navigate to={ROUTES.welcome} replace />} />
    </Routes>
  );
}
