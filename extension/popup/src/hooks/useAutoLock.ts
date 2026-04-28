import { useEffect } from "react";
import { useWalletStore } from "../store/walletStore";
import { touchLockTimer } from "../utils/storage";

export function useAutoLock() {
  const unlocked = useWalletStore((s) => s.unlocked);
  const autoLockMinutes = useWalletStore((s) => s.autoLockMinutes);
  const lockWallet = useWalletStore((s) => s.lockWallet);

  useEffect(() => {
    if (!unlocked) return;

    let interval: number | undefined;

    const refresh = async () => {
      await touchLockTimer(autoLockMinutes);
    };

    const handleActivity = () => {
      void refresh();
    };

    window.addEventListener("click", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("mousemove", handleActivity);
    void refresh();

    interval = window.setInterval(async () => {
      const data = await chrome.storage.local.get(["lockAt", "unlocked"]);
      if (data.unlocked && data.lockAt && Date.now() >= data.lockAt) {
        await lockWallet();
      }
    }, 5000);

    return () => {
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("mousemove", handleActivity);
      if (interval) window.clearInterval(interval);
    };
  }, [autoLockMinutes, lockWallet, unlocked]);
}
