import type { StoredState } from "../types";

const DEFAULT_STATE: StoredState = {
  wallet: null,
  activeChainId: "0x1",
  customNetworks: {},
  darkMode: false,
  autoLockMinutes: 10,
};

export async function readStoredState(): Promise<StoredState> {
  const data = await chrome.storage.local.get("noahState");
  return { ...DEFAULT_STATE, ...(data.noahState || {}) };
}

export async function writeStoredState(state: StoredState) {
  await chrome.storage.local.set({ noahState: state });
}

export async function touchLockTimer(minutes: number) {
  const lockAt = Date.now() + minutes * 60 * 1000;
  await chrome.storage.local.set({ lockAt, unlocked: true });
}
