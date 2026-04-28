import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { StoredWallet } from "../types";
import { ROUTES, isOnboardingPath } from "../routes/paths";

type Params = {
  initialized: boolean;
  wallet: StoredWallet | null;
  unlocked: boolean;
};

export function useAuthRedirect({ initialized, wallet, unlocked }: Params) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!initialized) return;

    const path = location.pathname;

    if (!wallet && !isOnboardingPath(path)) {
      navigate(ROUTES.welcome, { replace: true });
      return;
    }

    if (wallet && !unlocked && path !== ROUTES.unlock) {
      navigate(ROUTES.unlock, { replace: true });
      return;
    }

    if (
      wallet &&
      unlocked &&
      (path === "/" || path === ROUTES.unlock || path === ROUTES.welcome || path === ROUTES.dashboardRoot)
    ) {
      navigate(ROUTES.dashboardBalance, { replace: true });
    }
  }, [initialized, wallet, unlocked, location.pathname, navigate]);
}
