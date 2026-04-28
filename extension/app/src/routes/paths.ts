export const ROUTES = {
  welcome: "/welcome",
  importRecovery: "/import/recovery",
  importPrivateKey: "/import/private-key",
  onboardingRecovery: "/onboarding/recovery",
  onboardingPassword: "/onboarding/password",
  importPassword: "/import/password",
  importPrivateKeyPassword: "/import/private-key/password",
  unlock: "/unlock",
  dashboardRoot: "/dashboard",
  dashboardBalance: "/dashboard/balance",
  dashboardReceive: "/dashboard/receive",
  dashboardSend: "/dashboard/send",
  dashboardSwap: "/dashboard/swap",
  dashboardActivity: "/dashboard/activity",
  dashboardSettings: "/dashboard/settings",
} as const;

export function isOnboardingPath(path: string): boolean {
  return (
    path === ROUTES.welcome ||
    path === ROUTES.importRecovery ||
    path === ROUTES.importPrivateKey ||
    path === ROUTES.onboardingRecovery ||
    path === ROUTES.onboardingPassword ||
    path === ROUTES.importPassword ||
    path === ROUTES.importPrivateKeyPassword
  );
}
