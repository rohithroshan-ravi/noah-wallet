import { create } from "zustand";
import { ethers } from "ethers";
import { DEFAULT_NETWORKS, type EvmNetwork } from "../../../src/shared/networks";
import type { StoredState, StoredWallet, TokenBalance, TxRecord } from "../types";
import { decryptText, encryptText } from "../utils/crypto";
import { fetchPortfolio, fetchTransactionHistory } from "../utils/api";
import { readStoredState, touchLockTimer, writeStoredState } from "../utils/storage";
import { sendErc20Transfer, sendNativeTransfer } from "../utils/evm";

type WalletStore = {
  loading: boolean;
  initialized: boolean;
  unlocked: boolean;
  unlockedPrivateKey: string | null;
  wallet: StoredWallet | null;
  activeChainId: string;
  customNetworks: Record<string, EvmNetwork>;
  darkMode: boolean;
  autoLockMinutes: number;
  authToken: string | null;
  nativeBalance: string;
  nativeUsdValue: number;
  tokenBalances: TokenBalance[];
  transactions: TxRecord[];
  error: string | null;
  init: () => Promise<void>;
  createWallet: (password: string) => Promise<void>;
  importWithPrivateKey: (privateKey: string, password: string) => Promise<void>;
  importWithMnemonic: (mnemonic: string, password: string) => Promise<void>;
  unlockWallet: (password: string) => Promise<void>;
  lockWallet: () => Promise<void>;
  setDarkMode: (enabled: boolean) => Promise<void>;
  setAutoLockMinutes: (minutes: number) => Promise<void>;
  setActiveChain: (chainId: string) => Promise<void>;
  addCustomNetwork: (network: EvmNetwork) => Promise<void>;
  refreshPortfolio: () => Promise<void>;
  sendNative: (to: string, amount: string) => Promise<string>;
  sendToken: (tokenAddress: string, to: string, amount: string, decimals: number) => Promise<string>;
  signInWithEthereum: () => Promise<void>;
};

function getCurrentNetwork(state: WalletStore): EvmNetwork {
  return ({ ...DEFAULT_NETWORKS, ...state.customNetworks } as Record<string, EvmNetwork>)[state.activeChainId];
}

async function persistFromState(state: WalletStore) {
  const payload: StoredState = {
    wallet: state.wallet,
    activeChainId: state.activeChainId,
    customNetworks: state.customNetworks,
    darkMode: state.darkMode,
    autoLockMinutes: state.autoLockMinutes,
    authToken: state.authToken
  };

  await writeStoredState(payload);
}

async function pushSessionToBackground(
  address: string | null,
  unlockedPrivateKey: string | null,
  activeChainId?: string
) {
  await chrome.runtime.sendMessage({
    type: "NOAH_SESSION_UPDATE",
    address,
    unlockedPrivateKey,
    activeChainId
  });
}

async function authenticateAddress(address: string, privateKey: string, chainId: string) {
  const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

  const requestMessageRes = await fetch(`${base}/auth/request-message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, chainId })
  });

  if (!requestMessageRes.ok) throw new Error("Failed to request SIWE message");

  const msgBody = await requestMessageRes.json();
  const message = msgBody.data.message as string;

  const wallet = new ethers.Wallet(privateKey);
  const signature = await wallet.signMessage(message);

  const verifyRes = await fetch(`${base}/auth/verify-message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, signature })
  });

  if (!verifyRes.ok) throw new Error("Failed to verify SIWE message");

  const verifyBody = await verifyRes.json();
  return verifyBody.data.token as string;
}

export const useWalletStore = create<WalletStore>((set, get) => ({
  loading: false,
  initialized: false,
  unlocked: false,
  unlockedPrivateKey: null,
  wallet: null,
  activeChainId: "0x1",
  customNetworks: {},
  darkMode: false,
  autoLockMinutes: 10,
  authToken: null,
  nativeBalance: "0",
  nativeUsdValue: 0,
  tokenBalances: [],
  transactions: [],
  error: null,

  init: async () => {
    const stored = await readStoredState();
    set({
      wallet: stored.wallet,
      activeChainId: stored.activeChainId,
      customNetworks: stored.customNetworks,
      darkMode: stored.darkMode,
      autoLockMinutes: stored.autoLockMinutes,
      authToken: stored.authToken,
      initialized: true
    });

    if (stored.wallet?.address) {
      await pushSessionToBackground(stored.wallet.address, null, stored.activeChainId);
    }
  },

  createWallet: async (password) => {
    set({ loading: true, error: null });
    try {
      const wallet = ethers.Wallet.createRandom();
      const encryptedPrivateKey = await encryptText(wallet.privateKey, password);
      const encryptedMnemonic = wallet.mnemonic?.phrase
        ? await encryptText(wallet.mnemonic.phrase, password)
        : undefined;

      const storedWallet: StoredWallet = {
        address: wallet.address,
        encryptedPrivateKey,
        encryptedMnemonic
      };

      const state = get();
      set({ wallet: storedWallet, unlockedPrivateKey: wallet.privateKey, unlocked: true });
      await touchLockTimer(state.autoLockMinutes);
      const token = await authenticateAddress(wallet.address, wallet.privateKey, state.activeChainId);
      set({ authToken: token });
      await pushSessionToBackground(wallet.address, wallet.privateKey, state.activeChainId);
      await persistFromState(get());
      await get().refreshPortfolio();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to create wallet" });
    } finally {
      set({ loading: false });
    }
  },

  importWithPrivateKey: async (privateKey, password) => {
    set({ loading: true, error: null });
    try {
      const wallet = new ethers.Wallet(privateKey);
      const encryptedPrivateKey = await encryptText(wallet.privateKey, password);
      const storedWallet: StoredWallet = {
        address: wallet.address,
        encryptedPrivateKey
      };

      const state = get();
      set({ wallet: storedWallet, unlockedPrivateKey: wallet.privateKey, unlocked: true });
      await touchLockTimer(state.autoLockMinutes);
      const token = await authenticateAddress(wallet.address, wallet.privateKey, state.activeChainId);
      set({ authToken: token });
      await pushSessionToBackground(wallet.address, wallet.privateKey, state.activeChainId);
      await persistFromState(get());
      await get().refreshPortfolio();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to import wallet" });
    } finally {
      set({ loading: false });
    }
  },

  importWithMnemonic: async (mnemonic, password) => {
    const wallet = ethers.Wallet.fromPhrase(mnemonic.trim());
    await get().importWithPrivateKey(wallet.privateKey, password);
    const encryptedMnemonic = await encryptText(mnemonic.trim(), password);
    set((state) => ({ wallet: state.wallet ? { ...state.wallet, encryptedMnemonic } : state.wallet }));
    await persistFromState(get());
  },

  unlockWallet: async (password) => {
    const state = get();
    if (!state.wallet) throw new Error("Wallet not initialized");

    set({ loading: true, error: null });
    try {
      const privateKey = await decryptText(state.wallet.encryptedPrivateKey, password);
      set({ unlocked: true, unlockedPrivateKey: privateKey });
      await touchLockTimer(state.autoLockMinutes);
      if (!state.authToken) {
        const token = await authenticateAddress(state.wallet.address, privateKey, state.activeChainId);
        set({ authToken: token });
      }
      await pushSessionToBackground(state.wallet.address, privateKey, state.activeChainId);
      await persistFromState(get());
      await get().refreshPortfolio();
    } catch {
      set({ error: "Invalid password or corrupted vault" });
    } finally {
      set({ loading: false });
    }
  },

  lockWallet: async () => {
    const state = get();
    set({ unlocked: false, unlockedPrivateKey: null });
    await chrome.storage.local.set({ unlocked: false, lockAt: 0 });
    await pushSessionToBackground(state.wallet?.address || null, null, state.activeChainId);
  },

  setDarkMode: async (enabled) => {
    set({ darkMode: enabled });
    await persistFromState(get());
  },

  setAutoLockMinutes: async (minutes) => {
    set({ autoLockMinutes: minutes });
    await touchLockTimer(minutes);
    await persistFromState(get());
  },

  setActiveChain: async (chainId) => {
    set({ activeChainId: chainId });
    const state = get();
    await pushSessionToBackground(state.wallet?.address || null, state.unlockedPrivateKey, chainId);
    await persistFromState(state);
    await get().refreshPortfolio();
  },

  addCustomNetwork: async (network) => {
    set((state) => ({ customNetworks: { ...state.customNetworks, [network.chainId]: network } }));
    await persistFromState(get());
  },

  refreshPortfolio: async () => {
    const state = get();
    if (!state.wallet || !state.unlocked) return;

    set({ loading: true, error: null });
    try {
      const portfolio = await fetchPortfolio(state.authToken, state.activeChainId);
      const txs = await fetchTransactionHistory(state.authToken, state.activeChainId);
      set({
        nativeBalance: portfolio.nativeBalance,
        nativeUsdValue: portfolio.nativeUsdValue,
        tokenBalances: portfolio.tokenBalances,
        transactions: txs
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to fetch portfolio" });
    } finally {
      set({ loading: false });
    }
  },

  sendNative: async (to, amount) => {
    const state = get();
    if (!state.unlockedPrivateKey) throw new Error("Wallet is locked");
    const hash = await sendNativeTransfer(
      state.unlockedPrivateKey,
      getCurrentNetwork(state),
      to,
      amount
    );

    set((prev) => ({
      transactions: [
        {
          hash,
          from: prev.wallet?.address || "",
          to,
          value: amount,
          timestamp: new Date().toISOString(),
          status: "pending"
        },
        ...prev.transactions
      ]
    }));

    return hash;
  },

  sendToken: async (tokenAddress, to, amount, decimals) => {
    const state = get();
    if (!state.unlockedPrivateKey) throw new Error("Wallet is locked");
    const hash = await sendErc20Transfer(
      state.unlockedPrivateKey,
      getCurrentNetwork(state),
      tokenAddress,
      to,
      amount,
      decimals
    );

    set((prev) => ({
      transactions: [
        {
          hash,
          from: prev.wallet?.address || "",
          to,
          value: amount,
          timestamp: new Date().toISOString(),
          status: "pending"
        },
        ...prev.transactions
      ]
    }));

    return hash;
  },

  signInWithEthereum: async () => {
    const state = get();
    if (!state.wallet || !state.unlockedPrivateKey) throw new Error("Wallet is locked");

    const token = await authenticateAddress(
      state.wallet.address,
      state.unlockedPrivateKey,
      state.activeChainId
    );
    set({ authToken: token });
    await persistFromState(get());
  }
}));
