import type { TokenBalance, TxRecord } from "../types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

type ApiResponse<T> = {
  data: T;
};

async function request<T>(path: string, token: string | null, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string>)
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "API request failed");
  }

  const body = (await response.json()) as ApiResponse<T>;
  return body.data;
}

export async function fetchPortfolio(token: string | null, chainId: string) {
  return request<{
    nativeBalance: string;
    nativeUsdValue: number;
    tokenBalances: TokenBalance[];
  }>(`/wallet/balances?chainId=${encodeURIComponent(chainId)}`, token);
}

export async function fetchTransactionHistory(token: string | null, chainId: string) {
  return request<TxRecord[]>(`/wallet/transactions?chainId=${encodeURIComponent(chainId)}`, token);
}

export async function getPrice(symbol: string) {
  return request<{ usd: number }>(`/market/price?symbol=${encodeURIComponent(symbol)}`, null);
}
