import { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import { ArrowLeft, ChevronDown, Swap } from "../components/Icons";
import { useWalletStore } from "../store/walletStore";
import { fetchLifiChains, fetchLifiTokens, fetchLifiQuote } from "../utils/api";
import type { LifiChain, LifiToken, LifiQuote } from "../types";

type Props = { onBack: () => void };
type PickerTarget = "fromChain" | "toChain" | "fromToken" | "toToken";

const NATIVE_ADDR = "0x0000000000000000000000000000000000000000";

function TokenIcon({ token, size = 20 }: { token: LifiToken | null; size?: number }) {
  const [err, setErr] = useState(false);
  if (!token) return <div style={{ width: size, height: size }} className="rounded-full bg-[#2a2a2a]" />;
  if (token.logoURI && !err) {
    return (
      <img
        src={token.logoURI}
        alt={token.symbol}
        style={{ width: size, height: size }}
        className="rounded-full object-cover"
        onError={() => setErr(true)}
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.45 }}
      className="rounded-full bg-[#2a2a2a] flex items-center justify-center font-black text-white"
    >
      {token.symbol.slice(0, 1)}
    </div>
  );
}

function ChainIcon({ chain, size = 14 }: { chain: LifiChain | null; size?: number }) {
  const [err, setErr] = useState(false);
  if (!chain?.logoURI || err) return null;
  return (
    <img
      src={chain.logoURI}
      alt={chain.name}
      style={{ width: size, height: size }}
      className="rounded-full object-cover"
      onError={() => setErr(true)}
    />
  );
}

export function SwapTab({ onBack }: Props) {
  const chainId = useWalletStore((s) => s.chainId);
  const account = useWalletStore((s) => s.account);
  const unlockedPrivateKey = useWalletStore((s) => s.unlockedPrivateKey);

  const [chains, setChains] = useState<LifiChain[]>([]);
  const [chainsLoading, setChainsLoading] = useState(true);

  const [fromChain, setFromChain] = useState<LifiChain | null>(null);
  const [toChain, setToChain] = useState<LifiChain | null>(null);
  const [fromTokens, setFromTokens] = useState<LifiToken[]>([]);
  const [toTokens, setToTokens] = useState<LifiToken[]>([]);
  const [fromToken, setFromToken] = useState<LifiToken | null>(null);
  const [toToken, setToToken] = useState<LifiToken | null>(null);
  const [tokensLoading, setTokensLoading] = useState(false);

  const [sellAmt, setSellAmt] = useState("");
  const [quote, setQuote] = useState<LifiQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const [swapping, setSwapping] = useState(false);
  const [swapError, setSwapError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const [picker, setPicker] = useState<PickerTarget | null>(null);
  const [search, setSearch] = useState("");

  const quoteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load chains on mount
  useEffect(() => {
    fetchLifiChains().then((data) => {
      setChains(data);
      setChainsLoading(false);
      const currentId = parseInt(chainId, 16);
      const defaultFrom = data.find((c) => c.id === currentId) ?? data[0] ?? null;
      const defaultTo = data.find((c) => c.id !== defaultFrom?.id) ?? null;
      setFromChain(defaultFrom);
      setToChain(defaultTo);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load tokens when fromChain changes
  useEffect(() => {
    if (!fromChain) return;
    setFromTokens([]);
    setFromToken(null);
    setTokensLoading(true);
    fetchLifiTokens(fromChain.id).then((tokens) => {
      setFromTokens(tokens);
      const native = tokens.find((t) => t.address.toLowerCase() === NATIVE_ADDR) ?? tokens[0] ?? null;
      setFromToken(native);
      setTokensLoading(false);
    });
  }, [fromChain?.id]);

  // Load tokens when toChain changes
  useEffect(() => {
    if (!toChain) return;
    setToTokens([]);
    setToToken(null);
    setTokensLoading(true);
    fetchLifiTokens(toChain.id).then((tokens) => {
      setToTokens(tokens);
      const usdc = tokens.find((t) => t.symbol === "USDC") ?? tokens[0] ?? null;
      setToToken(usdc);
      setTokensLoading(false);
    });
  }, [toChain?.id]);

  // Debounced quote fetch
  useEffect(() => {
    setQuote(null);
    setQuoteError(null);
    if (!fromToken || !toToken || !fromChain || !toChain || !sellAmt || !account) return;
    const numAmt = parseFloat(sellAmt);
    if (isNaN(numAmt) || numAmt <= 0) return;

    if (quoteTimer.current) clearTimeout(quoteTimer.current);
    quoteTimer.current = setTimeout(async () => {
      setQuoteLoading(true);
      try {
        const fromAmount = ethers.parseUnits(sellAmt, fromToken.decimals).toString();
        const result = await fetchLifiQuote({
          fromChain: fromChain.id,
          toChain: toChain.id,
          fromToken: fromToken.address,
          toToken: toToken.address,
          fromAmount,
          fromAddress: account,
        });
        if (result) {
          setQuote(result);
        } else {
          setQuoteError("No route found for this pair");
        }
      } catch {
        setQuoteError("Failed to fetch quote");
      } finally {
        setQuoteLoading(false);
      }
    }, 700);

    return () => { if (quoteTimer.current) clearTimeout(quoteTimer.current); };
  }, [fromToken?.address, toToken?.address, fromChain?.id, toChain?.id, sellAmt, account]);

  async function executeSwap() {
    if (!quote || !unlockedPrivateKey || !fromChain) return;
    setSwapping(true);
    setSwapError(null);
    try {
      const rpcUrl = fromChain.metamask?.rpcUrls?.[0];
      if (!rpcUrl) throw new Error("No RPC URL for this chain");
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const wallet = new ethers.Wallet(unlockedPrivateKey, provider);
      const tx = await wallet.sendTransaction(quote.transactionRequest as ethers.TransactionRequest);
      setTxHash(tx.hash);
    } catch (e: unknown) {
      setSwapError(e instanceof Error ? e.message : "Swap failed");
    } finally {
      setSwapping(false);
    }
  }

  function swapSides() {
    const [fc, tc] = [fromChain, toChain];
    const [ft, tt] = [fromToken, toToken];
    const [fts, tts] = [fromTokens, toTokens];
    setFromChain(tc); setToChain(fc);
    setFromToken(tt); setToToken(ft);
    setFromTokens(tts); setToTokens(fts);
    setSellAmt(""); setQuote(null); setQuoteError(null);
  }

  function openPicker(target: PickerTarget) { setPicker(target); setSearch(""); }
  function closePicker() { setPicker(null); setSearch(""); }

  // Derived values
  const toAmount = quote && toToken
    ? parseFloat(ethers.formatUnits(quote.estimate.toAmount, toToken.decimals)).toFixed(6)
    : null;

  const rate = quote && fromToken && toToken && sellAmt
    ? (parseFloat(ethers.formatUnits(quote.estimate.toAmount, toToken.decimals)) / parseFloat(sellAmt)).toFixed(6)
    : null;

  const gasCost = quote?.estimate.gasCosts?.[0];
  const gasCostFormatted = gasCost
    ? `${parseFloat(ethers.formatUnits(gasCost.amount, gasCost.token.decimals)).toFixed(5)} ${gasCost.token.symbol}`
    : null;

  const durationMin = quote?.estimate.executionDuration
    ? Math.ceil(quote.estimate.executionDuration / 60)
    : null;

  const isPickerChain = picker === "fromChain" || picker === "toChain";

  const pickerChains = chains.filter((c) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return c.name.toLowerCase().includes(s) || c.coin.toLowerCase().includes(s);
  });

  const pickerTokens = (picker === "fromToken" ? fromTokens : toTokens)
    .filter((t) => {
      if (!search) return true;
      const s = search.toLowerCase();
      return t.symbol.toLowerCase().includes(s) || t.name.toLowerCase().includes(s);
    })
    .slice(0, 60);

  return (
    <div className="flex min-h-screen flex-col bg-[#0d0d0d] relative">

      {/* ── Picker overlay ── */}
      {picker && (
        <div className="absolute inset-0 z-50 bg-[#0d0d0d] flex flex-col px-5 pt-5">
          <button className="mb-4 self-start" onClick={closePicker}>
            <ArrowLeft />
          </button>
          <h2 className="mb-4 text-base font-bold text-white">
            {isPickerChain ? "Select Network" : "Select Token"}
          </h2>
          <input
            className="field mb-3"
            placeholder={isPickerChain ? "Search networks…" : "Search tokens…"}
            value={search}
            autoFocus
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex-1 overflow-y-auto space-y-0.5 pb-6">
            {isPickerChain
              ? pickerChains.map((chain) => {
                  const selected =
                    (picker === "fromChain" && chain.id === fromChain?.id) ||
                    (picker === "toChain" && chain.id === toChain?.id);
                  return (
                    <button
                      key={chain.id}
                      className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${selected ? "bg-[#1c1c1c]" : "hover:bg-[#141414]"}`}
                      onClick={() => {
                        if (picker === "fromChain") setFromChain(chain);
                        else setToChain(chain);
                        closePicker();
                      }}
                    >
                      <ChainIcon chain={chain} size={28} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{chain.name}</p>
                        <p className="text-xs text-[#888]">{chain.coin}</p>
                      </div>
                      {selected && <span className="text-[#c8ff00] text-sm">✓</span>}
                    </button>
                  );
                })
              : pickerTokens.map((token) => {
                  const selected =
                    (picker === "fromToken" && token.address === fromToken?.address) ||
                    (picker === "toToken" && token.address === toToken?.address);
                  return (
                    <button
                      key={`${token.chainId}-${token.address}`}
                      className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${selected ? "bg-[#1c1c1c]" : "hover:bg-[#141414]"}`}
                      onClick={() => {
                        if (picker === "fromToken") setFromToken(token);
                        else setToToken(token);
                        closePicker();
                      }}
                    >
                      <TokenIcon token={token} size={28} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white">{token.symbol}</p>
                        <p className="text-xs text-[#888] truncate">{token.name}</p>
                      </div>
                      {token.priceUSD && (
                        <span className="text-xs text-[#888]">${parseFloat(token.priceUSD).toFixed(2)}</span>
                      )}
                      {selected && <span className="text-[#c8ff00] text-sm ml-1">✓</span>}
                    </button>
                  );
                })}
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <div className="flex flex-col flex-1 px-5 pt-5">
        <button className="mb-6 self-start" onClick={onBack}>
          <ArrowLeft />
        </button>
        <h1 className="mb-6 text-xl font-extrabold text-white">Swap</h1>

        {/* Success state */}
        {txHash ? (
          <div className="card px-4 py-6 text-center space-y-3">
            <p className="text-[#4ade80] text-base font-bold">Swap submitted!</p>
            <p className="text-xs text-[#888] break-all font-mono">{txHash}</p>
            <button
              className="btn-lime mt-2"
              onClick={() => { setTxHash(null); setSellAmt(""); setQuote(null); }}
            >
              New Swap
            </button>
          </div>
        ) : chainsLoading ? (
          <div className="flex-1 flex items-center justify-center text-[#888] text-sm">
            Loading networks…
          </div>
        ) : (
          <>
            {/* Sell card */}
            <div className="card px-4 py-4 space-y-3">
              <p className="text-xs text-[#888]">You Sell</p>
              <button
                className="flex items-center gap-1.5 rounded-lg bg-[#1c1c1c] border border-[#2a2a2a] px-2.5 py-1.5 text-xs text-[#888] hover:text-white transition"
                onClick={() => openPicker("fromChain")}
              >
                <ChainIcon chain={fromChain} size={13} />
                <span>{fromChain?.name ?? "Select network"}</span>
                <ChevronDown size={10} />
              </button>
              <div className="flex items-center gap-3">
                <button
                  className="flex items-center gap-2 rounded-full bg-[#2a2a2a] px-3 py-1.5 hover:bg-[#333] transition flex-shrink-0"
                  onClick={() => openPicker("fromToken")}
                  disabled={tokensLoading && !fromToken}
                >
                  <TokenIcon token={fromToken} size={20} />
                  <span className="text-sm font-semibold text-white">
                    {fromToken?.symbol ?? (tokensLoading ? "…" : "Select")}
                  </span>
                  <ChevronDown size={12} className="text-[#888]" />
                </button>
                <input
                  className="flex-1 bg-transparent text-right text-xl font-bold text-white outline-none placeholder-[#444]"
                  placeholder="0.00"
                  type="number"
                  min="0"
                  value={sellAmt}
                  onChange={(e) => setSellAmt(e.target.value)}
                />
              </div>
            </div>

            {/* Swap direction button */}
            <div className="flex justify-center py-2">
              <button
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1c1c1c] border border-[#2a2a2a] hover:border-[#c8ff00] transition"
                onClick={swapSides}
              >
                <Swap size={16} className="text-[#c8ff00]" />
              </button>
            </div>

            {/* Receive card */}
            <div className="card px-4 py-4 space-y-3">
              <p className="text-xs text-[#888]">You Receive</p>
              <button
                className="flex items-center gap-1.5 rounded-lg bg-[#1c1c1c] border border-[#2a2a2a] px-2.5 py-1.5 text-xs text-[#888] hover:text-white transition"
                onClick={() => openPicker("toChain")}
              >
                <ChainIcon chain={toChain} size={13} />
                <span>{toChain?.name ?? "Select network"}</span>
                <ChevronDown size={10} />
              </button>
              <div className="flex items-center gap-3">
                <button
                  className="flex items-center gap-2 rounded-full bg-[#2a2a2a] px-3 py-1.5 hover:bg-[#333] transition flex-shrink-0"
                  onClick={() => openPicker("toToken")}
                  disabled={tokensLoading && !toToken}
                >
                  <TokenIcon token={toToken} size={20} />
                  <span className="text-sm font-semibold text-white">
                    {toToken?.symbol ?? (tokensLoading ? "…" : "Select")}
                  </span>
                  <ChevronDown size={12} className="text-[#888]" />
                </button>
                <div className="flex-1 text-right">
                  {quoteLoading ? (
                    <span className="text-sm text-[#888] animate-pulse">Fetching…</span>
                  ) : toAmount ? (
                    <span className="text-xl font-bold text-white">{toAmount}</span>
                  ) : (
                    <span className="text-xl font-bold text-[#444]">—</span>
                  )}
                </div>
              </div>
            </div>

            {/* Quote details */}
            {(quote || quoteLoading) && (
              <div className="mt-4 card px-4 py-3 text-xs text-[#888] space-y-2">
                <div className="flex justify-between">
                  <span>Rate</span>
                  <span className="text-white">
                    {rate ? `1 ${fromToken?.symbol} ≈ ${rate} ${toToken?.symbol}` : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Est. Network Fee</span>
                  <span className="text-white">{gasCostFormatted ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Est. Duration</span>
                  <span className="text-white">{durationMin ? `~${durationMin}m` : "—"}</span>
                </div>
                {quote?.estimate.toAmountUSD && (
                  <div className="flex justify-between">
                    <span>Receive Value</span>
                    <span className="text-white">${parseFloat(quote.estimate.toAmountUSD).toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}

            {quoteError && <p className="mt-3 text-center text-xs text-[#ff4d4d]">{quoteError}</p>}
            {swapError && <p className="mt-2 text-center text-xs text-[#ff4d4d]">{swapError}</p>}

            <div className="mt-auto pb-10 pt-6">
              <button
                className="btn-lime"
                disabled={!quote || swapping || !unlockedPrivateKey || quoteLoading}
                onClick={executeSwap}
              >
                {swapping ? "Swapping…" : !unlockedPrivateKey ? "Unlock wallet to swap" : "Swap"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
