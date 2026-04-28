import type { EvmNetwork } from "../../src/shared/networks";

export type EncryptedPayload = {
  cipherText: string;
  iv: string;
  salt: string;
};

export type StoredWallet = {
  address: string;
  encryptedPrivateKey: EncryptedPayload;
  encryptedMnemonic?: EncryptedPayload;
};

export type StoredState = {
  wallet: StoredWallet | null;
  activeChainId: string;
  customNetworks: Record<string, EvmNetwork>;
  darkMode: boolean;
  autoLockMinutes: number;
  authToken: string | null;
};

export type TokenBalance = {
  tokenAddress: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  usdValue?: number;
};

export type TxRecord = {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: string;
  status?: "pending" | "success" | "failed";
};
