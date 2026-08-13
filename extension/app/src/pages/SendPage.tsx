import { useState } from "react";
import { ArrowLeft, ChevronDown } from "../components/Icons";
import { useWalletStore } from "../store/walletStore";
import { DEFAULT_NETWORKS } from "../../../src/shared/networks";

type Props = { onBack: () => void };

export function SendPage({ onBack }: Props) {
  const sendNative = useWalletStore((s) => s.sendNative);
  const portfolio = useWalletStore((s) => s.portfolio);
  const loading = useWalletStore((s) => s.loading);
  const error = useWalletStore((s) => s.error);
  const txHash = useWalletStore((s) => s.lastTxHash);
  const chainId = useWalletStore((s) => s.chainId);
  const customNetworks = useWalletStore((s) => s.customNetworks);
  const setChainId = useWalletStore((s) => s.setChainId);

  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [networkOpen, setNetworkOpen] = useState(false);

  const token = portfolio[selectedIdx];
  const networks = { ...DEFAULT_NETWORKS, ...customNetworks };
  const currentNetwork = networks[chainId];

  const handleSend = async () => {
    if (!to || !amount) return;
    await sendNative(to, amount);
  };

  const handleSwitchNetwork = async (id: string) => {
    setNetworkOpen(false);
    if (id === chainId) return;
    setSelectedIdx(0); // the token list is chain-scoped and about to change
    await setChainId(id);
  };

  if (txHash) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0d0d0d] px-6 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#c8ff0020]">
          <span className="text-3xl text-[#c8ff00]">✓</span>
        </div>
        <h2 className="text-xl font-extrabold text-white">Transaction Sent!</h2>
        <p className="mt-2 break-all text-xs text-[#888]">{txHash}</p>
        <button className="btn-lime mt-10 w-full" onClick={onBack}>Done</button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0d0d0d] px-5 pt-5">
      <button className="mb-6 self-start" onClick={onBack}>
        <ArrowLeft />
      </button>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-white">Send</h1>

        {/* Network switcher */}
        <div className="relative">
          <button
            className="flex items-center gap-1.5 rounded-full border border-[#2a2a2a] bg-[#161616] px-3 py-1.5 text-xs font-semibold text-white hover:border-[#c8ff00] transition"
            onClick={() => setNetworkOpen((o) => !o)}
          >
            {currentNetwork?.chainName ?? `Chain ${chainId}`}
            <ChevronDown size={14} className="text-[#888]" />
          </button>

          {networkOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setNetworkOpen(false)} />
              <div className="card absolute right-0 top-full z-20 mt-2 w-52 overflow-hidden p-1">
                {Object.values(networks).map((net) => (
                  <button
                    key={net.chainId}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                      net.chainId === chainId
                        ? "bg-[#c8ff0020] text-[#c8ff00]"
                        : "text-white hover:bg-[#222]"
                    }`}
                    onClick={() => handleSwitchNetwork(net.chainId)}
                  >
                    {net.chainName}
                    {net.chainId === chainId && <span className="text-xs">✓</span>}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* Token selector */}
        <div className="card flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#222] text-sm font-black text-white">
              {token?.symbol?.slice(0, 1) ?? "?"}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{token?.symbol ?? "Select"}</p>
              <p className="text-xs text-[#888]">Balance: {token?.balance ?? "—"}</p>
            </div>
          </div>
          <ChevronDown size={16} className="text-[#888]" />
        </div>

        {/* To */}
        <div>
          <label className="mb-1.5 block text-xs text-[#888]">Recipient Address</label>
          <input
            className="field"
            placeholder="0x…"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>

        {/* Amount */}
        <div>
          <label className="mb-1.5 block text-xs text-[#888]">Amount</label>
          <div className="relative">
            <input
              className="field pr-14"
              placeholder="0.00"
              type="number"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-[#2a2a2a] px-2 py-0.5 text-[10px] font-bold text-[#c8ff00]"
              onClick={() => setAmount(token?.balance ?? "")}
            >
              MAX
            </button>
          </div>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>

      <div className="mt-auto pb-10 pt-8">
        <button
          className="btn-lime"
          disabled={!to || !amount || loading}
          onClick={handleSend}
        >
          {loading ? "Sending…" : "Send"}
        </button>
      </div>
    </div>
  );
}
