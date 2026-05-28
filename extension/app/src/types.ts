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
};

export type TokenBalance = {
  tokenAddress: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  usdValue?: number;
  priceChange?: number;
};

export type TxRecord = {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: string;
  status?: "pending" | "success" | "failed";
};

export type LifiChain = {
  key: string;
  name: string;
  id: number;
  coin: string;
  chainType: string;
  mainnet: boolean;
  logoURI?: string;
  nativeToken: {
    address: string;
    symbol: string;
    decimals: number;
    chainId: number;
    name: string;
  };
  metamask?: {
    chainId: string;
    chainName: string;
    rpcUrls: string[];
    blockExplorerUrls?: string[];
  };
};

export type LifiToken = {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  chainId: number;
  logoURI?: string;
  priceUSD?: string;
};

export type LifiQuote = {
  transactionRequest: {
    from: string;
    to: string;
    data: string;
    value: string;
    gasPrice?: string;
    gasLimit?: string;
    chainId: number;
  };
  estimate: {
    fromAmount: string;
    toAmount: string;
    toAmountMin: string;
    gasCosts: Array<{
      amount: string;
      amountUSD?: string;
      token: { symbol: string; decimals: number; priceUSD?: string };
    }>;
    executionDuration: number;
    fromAmountUSD?: string;
    toAmountUSD?: string;
  };
  action: {
    fromToken: LifiToken;
    toToken: LifiToken;
    fromAmount: string;
    slippage: number;
    fromChainId: number;
    toChainId: number;
  };
};
