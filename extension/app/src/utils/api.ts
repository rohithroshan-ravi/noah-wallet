import { ethers } from "ethers";
import type { LifiChain, LifiToken, LifiQuote, TokenBalance, TxRecord } from "../types";

const BASE = "https://deep-index.moralis.io/api/v2.2";

function apiKey(): string {
  return (import.meta.env.VITE_MORALIS_API_KEY as string) ?? "";
}

function h(): HeadersInit {
  return { "X-API-Key": apiKey() };
}

// Map EVM hex chainId → Moralis chain slug
function chainSlug(chainId: string): string {
  const map: Record<string, string> = {
    "0x1":    "eth",
    "0x89":   "polygon",
    "0x38":   "bsc",
    "0xa":    "optimism",
    "0xa4b1": "arbitrum",
    "0x2105": "base",
    "0xa86a": "avalanche",
  };
  return map[chainId.toLowerCase()] ?? chainId;
}

// ─── Native balance ───────────────────────────────────────────────────────────
export async function fetchNativeBalance(address: string, chainId: string): Promise<string> {
  const res = await fetch(`${BASE}/${address}/balance?chain=${chainSlug(chainId)}`, { headers: h() });
  if (!res.ok) return "0";
  const { balance } = (await res.json()) as { balance: string };
  return ethers.formatEther(balance ?? "0");
}

// ─── ERC-20 token balances ────────────────────────────────────────────────────
type MoralisToken = {
  token_address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  usd_value?: number | null;
  usd_price_24hr_percent_change?: number | null;
};

export async function fetchTokenBalances(address: string, chainId: string): Promise<TokenBalance[]> {
  const res = await fetch(
    `${BASE}/${address}/erc20?chain=${chainSlug(chainId)}&exclude_spam=true`,
    { headers: h() }
  );
  if (!res.ok) return [];
  const data = (await res.json()) as MoralisToken[];
  return data.map((t) => ({
    tokenAddress: t.token_address,
    symbol: t.symbol ?? "???",
    name: t.name ?? t.symbol,
    decimals: t.decimals,
    balance: ethers.formatUnits(t.balance ?? "0", t.decimals),
    usdValue: t.usd_value ?? undefined,
    priceChange: t.usd_price_24hr_percent_change ?? undefined,
  }));
}

// ─── Transaction history ──────────────────────────────────────────────────────
type MoralisTx = {
  hash: string;
  from_address: string;
  to_address: string;
  value: string;
  block_timestamp: string;
  receipt_status: string;
};

export async function fetchTransactions(address: string, chainId: string): Promise<TxRecord[]> {
  const res = await fetch(
    `${BASE}/${address}?chain=${chainSlug(chainId)}&limit=50`,
    { headers: h() }
  );
  if (!res.ok) return [];
  const { result } = (await res.json()) as { result: MoralisTx[] };
  return (result ?? []).map((tx) => ({
    hash: tx.hash,
    from: tx.from_address,
    to: tx.to_address,
    value: ethers.formatEther(tx.value ?? "0"),
    timestamp: tx.block_timestamp,
    status: tx.receipt_status === "1" ? "success" : "failed",
  }));
}

// ─── Native token USD price via Moralis price endpoint ───────────────────────
// WETH/WMATIC/WBNB used as proxy for the chain's native asset price
const NATIVE_WRAP: Record<string, string> = {
  "0x1":  "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  "0x89": "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
  "0x38": "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
};

// ─── LI.FI (via backend proxy) ───────────────────────────────────────────────

function apiBase(): string {
  return (import.meta.env.VITE_API_BASE_URL as string) ?? "http://localhost:8080";
}

function backendHeaders(): HeadersInit {
  const key = (import.meta.env.VITE_API_KEY as string) ?? "";
  return key ? { "X-API-Key": key } : {};
}

type BackendResponse<T> = { success: boolean; data: T };

async function backendGet<T>(path: string, query?: Record<string, string>): Promise<T | null> {
  const url = new URL(`${apiBase()}/api/v1${path}`);
  if (query) Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { headers: backendHeaders() });
  if (!res.ok) return null;
  const body = (await res.json()) as BackendResponse<T>;
  return body.data ?? null;
}

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
    fromChain: String(params.fromChain),
    toChain: String(params.toChain),
    fromToken: params.fromToken,
    toToken: params.toToken,
    fromAmount: params.fromAmount,
    fromAddress: params.fromAddress,
    slippage: String(params.slippage ?? 0.005),
  });
}

export async function fetchNativeUsdPrice(chainId: string): Promise<number> {
  const token = NATIVE_WRAP[chainId.toLowerCase()];
  if (!token) return 0;
  const res = await fetch(
    `${BASE}/erc20/${token}/price?chain=${chainSlug(chainId)}`,
    { headers: h() }
  );
  if (!res.ok) return 0;
  const data = (await res.json()) as { usdPrice?: number };
  return data.usdPrice ?? 0;
}
