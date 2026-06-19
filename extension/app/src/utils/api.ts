import { ethers } from "ethers";
import type { LifiChain, LifiToken, LifiQuote, TokenBalance, TxRecord } from "../types";

// ── Backend config ────────────────────────────────────────────────────────────

function apiBase(): string {
  return (import.meta.env.VITE_API_BASE_URL as string) ?? "http://localhost:8080";
}

function backendHeaders(): HeadersInit {
  const key = (import.meta.env.VITE_API_KEY as string) ?? "";
  return key ? { "X-API-Key": key } : {};
}

// New unified envelope shape from the backend.
type Envelope<T> = {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
  meta: { timestamp: string; requestId?: string; count?: number };
};

async function backendGet<T>(path: string, query?: Record<string, string>): Promise<T | null> {
  const url = new URL(`${apiBase()}/api/v1${path}`);
  if (query) {
    Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  try {
    const res = await fetch(url.toString(), { headers: backendHeaders() });
    if (!res.ok) return null;
    const body = (await res.json()) as Envelope<T>;
    return body.success ? (body.data ?? null) : null;
  } catch {
    return null;
  }
}

// ── Chain mapping ─────────────────────────────────────────────────────────────
// Maps EVM hex chainId → backend chain slug (Moralis-style)

const CHAIN_SLUGS: Record<string, string> = {
  "0x1":    "eth",
  "0x89":   "polygon",
  "0x38":   "bsc",
  "0xa":    "optimism",
  "0xa4b1": "arbitrum",
  "0x2105": "base",
  "0xa86a": "avalanche",
  "0xfa":   "fantom",
  "0xe708": "linea",
  "0x19":   "cronos",
};

function chainSlug(chainId: string): string {
  return CHAIN_SLUGS[chainId.toLowerCase()] ?? "eth";
}

// Native token info per chain (symbol + name shown in portfolio)
const NATIVE_TOKEN: Record<string, { symbol: string; name: string }> = {
  "0x1":    { symbol: "ETH",   name: "Ethereum" },
  "0x89":   { symbol: "POL",   name: "POL" },
  "0x38":   { symbol: "BNB",   name: "BNB" },
  "0xa":    { symbol: "ETH",   name: "Ethereum" },
  "0xa4b1": { symbol: "ETH",   name: "Ethereum" },
  "0x2105": { symbol: "ETH",   name: "Ethereum" },
  "0xa86a": { symbol: "AVAX",  name: "Avalanche" },
  "0xfa":   { symbol: "FTM",   name: "Fantom" },
  "0xe708": { symbol: "ETH",   name: "Ethereum" },
  "0x19":   { symbol: "CRO",   name: "Cronos" },
};

export function nativeTokenInfo(chainId: string): { symbol: string; name: string } {
  return NATIVE_TOKEN[chainId.toLowerCase()] ?? { symbol: "ETH", name: "Ethereum" };
}

// ── Portfolio data — routed through our backend (failover-aware) ───────────────

type BackendBalance = { balance: string };

export async function fetchNativeBalance(address: string, chainId: string): Promise<string> {
  const data = await backendGet<BackendBalance>(
    `/wallets/${address}/balance`,
    { chain: chainSlug(chainId) },
  );
  return ethers.formatEther(data?.balance ?? "0");
}

type BackendToken = {
  token_address: string;
  symbol: string;
  name: string;
  decimals: string;
  balance: string;
  balance_formatted: string;
  usd_price: string;
  usd_value: string;
  logo: string;
  possible_spam: boolean;
};

export async function fetchTokenBalances(
  address: string,
  chainId: string,
): Promise<TokenBalance[]> {
  const data = await backendGet<BackendToken[]>(
    `/wallets/${address}/tokens`,
    { chain: chainSlug(chainId) },
  );
  if (!data) return [];
  return data
    .filter((t) => !t.possible_spam)
    .map((t) => {
      const decimals = parseInt(t.decimals ?? "18", 10);
      const balance =
        t.balance_formatted ||
        ethers.formatUnits(t.balance ?? "0", isNaN(decimals) ? 18 : decimals);
      return {
        tokenAddress: t.token_address,
        symbol: t.symbol ?? "???",
        name: t.name ?? t.symbol,
        decimals: isNaN(decimals) ? 18 : decimals,
        balance,
        usdValue: t.usd_value ? parseFloat(t.usd_value) : undefined,
        priceChange: undefined, // backend doesn't surface 24 h % change
      };
    });
}

type BackendTx = {
  hash: string;
  from_address: string;
  to_address: string;
  value: string;
  block_timestamp: string;
  transaction_fee: string;
};

export async function fetchTransactions(
  address: string,
  chainId: string,
): Promise<TxRecord[]> {
  const data = await backendGet<BackendTx[]>(
    `/wallets/${address}/transactions`,
    { chain: chainSlug(chainId) },
  );
  if (!data) return [];
  return data.map((tx) => ({
    hash: tx.hash,
    from: tx.from_address,
    to: tx.to_address ?? "",
    value: ethers.formatEther(tx.value ?? "0"),
    timestamp: tx.block_timestamp,
    status: "success" as const,
  }));
}

type BackendNetWorth = {
  total_networth_usd: string;
  chains: Array<{ chain: string; networth_usd: string }>;
};

// fetchNetWorth returns the total USD value across all assets for a given chain.
export async function fetchNetWorth(address: string, chainId: string): Promise<number> {
  const data = await backendGet<BackendNetWorth>(
    `/wallets/${address}/net-worth`,
    { chains: chainSlug(chainId) },
  );
  return parseFloat(data?.total_networth_usd ?? "0") || 0;
}

// ── LI.FI swap/bridge — already backend-routed ────────────────────────────────

export async function fetchLifiChains(): Promise<LifiChain[]> {
  return (await backendGet<LifiChain[]>("/swap/chains")) ?? [];
}

export async function fetchLifiTokens(chainId: number): Promise<LifiToken[]> {
  return (await backendGet<LifiToken[]>("/swap/tokens", { chainId: String(chainId) })) ?? [];
}

export type LifiQuoteParams = {
  fromChain: number;
  toChain: number;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  fromAddress: string;
  slippage?: number;
};

export async function fetchLifiQuote(params: LifiQuoteParams): Promise<LifiQuote | null> {
  return backendGet<LifiQuote>("/swap/quote", {
    fromChain:   String(params.fromChain),
    toChain:     String(params.toChain),
    fromToken:   params.fromToken,
    toToken:     params.toToken,
    fromAmount:  params.fromAmount,
    fromAddress: params.fromAddress,
    slippage:    String(params.slippage ?? 0.005),
  });
}
