import { create } from "zustand";
import { ethers } from "ethers";
import { DEFAULT_NETWORKS, type EvmNetwork } from "../../../src/shared/networks";
import type { StoredState, StoredWallet, TokenBalance } from "../types";
import { decryptText, encryptText } from "../utils/crypto";
import {
  fetchNativeBalance,
  fetchNetWorth,
  fetchTokenBalances,
  fetchTransactions,
  nativeTokenInfo,
} from "../utils/api";
import { readStoredState, touchLockTimer, writeStoredState } from "../utils/storage";
import { sendErc20Transfer, sendNativeTransfer } from "../utils/evm";

// Normalised portfolio token shape used by the UI
export type PortfolioToken = {
  symbol: string;
  name?: string;
  balance?: string;
  usdValue?: number;
  priceChange?: number;
  tokenAddress?: string;
  decimals?: number;
};

// Normalised tx shape used by the UI
export type UiTxRecord = {
  hash: string;
  from: string;
  to: string;
  value: string;
  symbol: string;
  direction: "in" | "out";
  date: string;
  status: "success" | "failed" | "pending";
};

type WalletStore = {
  loading: boolean;
  initialized: boolean;
  unlocked: boolean;
  unlockedPrivateKey: string | null;
  wallet: StoredWallet | null;
  account: string | null;
  chainId: string;
  customNetworks: Record<string, EvmNetwork>;
  darkMode: boolean;
  autoLockMinutes: number;
  portfolio: PortfolioToken[];
  txHistory: UiTxRecord[];
  error: string | null;
  lastTxHash: string | null;
  pendingSecret: string;

  init: () => Promise<void>;
  createWallet: (password: string) => Promise<void>;
  importWithPrivateKey: (privateKey: string, password: string) => Promise<void>;
  importWithMnemonic: (mnemonic: string, password: string) => Promise<void>;
  unlockWallet: (password: string) => Promise<void>;
  lockWallet: () => void;
  refreshPortfolio: () => Promise<void>;
  refreshTxHistory: () => Promise<void>;
  sendNative: (to: string, amount: string) => Promise<void>;
  sendToken: (tokenAddress: string, to: string, amount: string, decimals: number) => Promise<void>;
  setPendingSecret: (s: string) => void;
  clearError: () => void;
};

function getCurrentNetwork(chainId: string, customNetworks: Record<string, EvmNetwork>): EvmNetwork {
  return ({ ...DEFAULT_NETWORKS, ...customNetworks } as Record<string, EvmNetwork>)[chainId];
}

async function persistState(
  wallet: StoredWallet | null,
  chainId: string,
  customNetworks: Record<string, EvmNetwork>,
  darkMode: boolean,
  autoLockMinutes: number,
) {
  const payload: StoredState = { wallet, activeChainId: chainId, customNetworks, darkMode, autoLockMinutes };
  await writeStoredState(payload);
}

async function pushSession(address: string | null, privateKey: string | null, chainId: string) {
  chrome.runtime.sendMessage({ type: "NOAH_SESSION_UPDATE", address, unlockedPrivateKey: privateKey, activeChainId: chainId });
}

function mapTokensToPortfolio(
  nativeBalance: string,
  nativeUsdValue: number,
  nativeSymbol: string,
  nativeName: string,
  tokens: TokenBalance[],
): PortfolioToken[] {
  const native: PortfolioToken = {
    symbol: nativeSymbol,
    name: nativeName,
    balance: nativeBalance,
    usdValue: nativeUsdValue,
  };
  return [
    native,
    ...tokens.map((t) => ({
      symbol: t.symbol,
      name: t.name,
      balance: t.balance,
      usdValue: t.usdValue,
      priceChange: t.priceChange,
      tokenAddress: t.tokenAddress,
      decimals: t.decimals,
    })),
  ];
}

export const useWalletStore = create<WalletStore>((set, get) => ({
  loading: false,
  initialized: false,
  unlocked: false,
  unlockedPrivateKey: null,
  wallet: null,
  account: null,
  chainId: "0x1",
  customNetworks: {},
  darkMode: false,
  autoLockMinutes: 10,
  portfolio: [],
  txHistory: [],
  error: null,
  lastTxHash: null,
  pendingSecret: "",

  init: async () => {
    const stored = await readStoredState();
    set({
      wallet: stored.wallet,
      account: stored.wallet?.address ?? null,
      chainId: stored.activeChainId,
      customNetworks: stored.customNetworks,
      darkMode: stored.darkMode,
      autoLockMinutes: stored.autoLockMinutes,
      initialized: true,
    });
    if (stored.wallet?.address) {
      pushSession(stored.wallet.address, null, stored.activeChainId);
    }
  },

  createWallet: async (password) => {
    set({ loading: true, error: null });
    try {
      const w = ethers.Wallet.createRandom();
      const encryptedPrivateKey = await encryptText(w.privateKey, password);
      const encryptedMnemonic = w.mnemonic?.phrase
        ? await encryptText(w.mnemonic.phrase, password)
        : undefined;
      const storedWallet: StoredWallet = { address: w.address, encryptedPrivateKey, encryptedMnemonic };
      const { chainId, customNetworks, autoLockMinutes } = get();
      set({ wallet: storedWallet, account: w.address, unlockedPrivateKey: w.privateKey, unlocked: true });
      await touchLockTimer(autoLockMinutes);
      await persistState(storedWallet, chainId, customNetworks, get().darkMode, autoLockMinutes);
      pushSession(w.address, w.privateKey, chainId);
      await get().refreshPortfolio();
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Failed to create wallet" });
    } finally {
      set({ loading: false });
    }
  },

  importWithPrivateKey: async (privateKey, password) => {
    set({ loading: true, error: null });
    try {
      const w = new ethers.Wallet(privateKey);
      const encryptedPrivateKey = await encryptText(w.privateKey, password);
      const storedWallet: StoredWallet = { address: w.address, encryptedPrivateKey };
      const { chainId, customNetworks, autoLockMinutes } = get();
      set({ wallet: storedWallet, account: w.address, unlockedPrivateKey: w.privateKey, unlocked: true });
      await touchLockTimer(autoLockMinutes);
      await persistState(storedWallet, chainId, customNetworks, get().darkMode, autoLockMinutes);
      pushSession(w.address, w.privateKey, chainId);
      await get().refreshPortfolio();
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Failed to import wallet" });
    } finally {
      set({ loading: false });
    }
  },

  importWithMnemonic: async (mnemonic, password) => {
    const w = ethers.Wallet.fromPhrase(mnemonic.trim());
    await get().importWithPrivateKey(w.privateKey, password);
    const encryptedMnemonic = await encryptText(mnemonic.trim(), password);
    const wallet = get().wallet;
    if (wallet) {
      const updated = { ...wallet, encryptedMnemonic };
      set({ wallet: updated });
      const { chainId, customNetworks, autoLockMinutes, darkMode } = get();
      await persistState(updated, chainId, customNetworks, darkMode, autoLockMinutes);
    }
  },

  unlockWallet: async (password) => {
    const { wallet, chainId, autoLockMinutes } = get();
    if (!wallet) { set({ error: "Wallet not found" }); return; }
    set({ loading: true, error: null });
    try {
      const privateKey = await decryptText(wallet.encryptedPrivateKey, password);
      set({ unlocked: true, unlockedPrivateKey: privateKey, account: wallet.address });
      await touchLockTimer(autoLockMinutes);
      pushSession(wallet.address, privateKey, chainId);
      await get().refreshPortfolio();
    } catch {
      set({ error: "Invalid password" });
    } finally {
      set({ loading: false });
    }
  },

  lockWallet: () => {
    const { wallet, chainId } = get();
    set({ unlocked: false, unlockedPrivateKey: null });
    chrome.storage.local.set({ unlocked: false, lockAt: 0 });
    pushSession(wallet?.address ?? null, null, chainId);
  },

  refreshPortfolio: async () => {
    const { wallet, unlocked, account, chainId } = get();
    if (!wallet || !unlocked || !account) return;
    try {
      const [nativeBal, tokens, totalUsd] = await Promise.all([
        fetchNativeBalance(account, chainId),
        fetchTokenBalances(account, chainId),
        fetchNetWorth(account, chainId),
      ]);
      const tokenUsdSum = tokens.reduce((s, t) => s + (t.usdValue ?? 0), 0);
      const nativeUsd = Math.max(0, totalUsd - tokenUsdSum);
      const { symbol, name } = nativeTokenInfo(chainId);
      set({ portfolio: mapTokensToPortfolio(nativeBal, nativeUsd, symbol, name, tokens) });
    } catch { /* silent — stale data is acceptable */ }
  },

  refreshTxHistory: async () => {
    const { wallet, unlocked, account, chainId } = get();
    if (!wallet || !unlocked || !account) return;
    try {
      const txs = await fetchTransactions(account, chainId);
      set({
        txHistory: txs.map((tx) => ({
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          value: tx.value,
          symbol: "ETH",
          direction: tx.to.toLowerCase() === account.toLowerCase() ? "in" : "out",
          date: tx.timestamp,
          status: tx.status ?? "success",
        })),
      });
    } catch { /* silent */ }
  },

  sendNative: async (to, amount) => {
    const { unlockedPrivateKey, chainId, customNetworks, wallet } = get();
    if (!unlockedPrivateKey) { set({ error: "Wallet is locked" }); return; }
    set({ loading: true, error: null, lastTxHash: null });
    try {
      const hash = await sendNativeTransfer(
        unlockedPrivateKey,
        getCurrentNetwork(chainId, customNetworks),
        to,
        amount,
      );
      set({ lastTxHash: hash });
      set((s) => ({
        txHistory: [
          {
            hash,
            from: wallet?.address ?? "",
            to,
            value: amount,
            symbol: "ETH",
            direction: "out",
            date: new Date().toISOString(),
            status: "pending",
          },
          ...s.txHistory,
        ],
      }));
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Transaction failed" });
    } finally {
      set({ loading: false });
    }
  },

  sendToken: async (tokenAddress, to, amount, decimals) => {
    const { unlockedPrivateKey, chainId, customNetworks } = get();
    if (!unlockedPrivateKey) { set({ error: "Wallet is locked" }); return; }
    set({ loading: true, error: null, lastTxHash: null });
    try {
      const hash = await sendErc20Transfer(
        unlockedPrivateKey,
        getCurrentNetwork(chainId, customNetworks),
        tokenAddress,
        to,
        amount,
        decimals,
      );
      set({ lastTxHash: hash });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Transaction failed" });
    } finally {
      set({ loading: false });
    }
  },

  setPendingSecret: (s) => set({ pendingSecret: s }),
  clearError: () => set({ error: null }),
}));
