import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ActivityDetailPage, type TxRecord } from "../pages/ActivityTab";
import { useWalletStore } from "../store/walletStore";
import { ROUTES } from "./paths";

export function ActivityDetailRoute() {
  const { hash } = useParams();
  const navigate = useNavigate();
  const txHistory = useWalletStore((s) => s.txHistory);
  const tx = txHistory.find((item) => item.hash === hash) as TxRecord | undefined;

  if (!tx) {
    return <Navigate to={ROUTES.dashboardActivity} replace />;
  }

  return <ActivityDetailPage tx={tx} onBack={() => navigate(ROUTES.dashboardActivity)} />;
}
