import { FormEvent, useMemo, useState } from "react";
import { useWalletStore } from "../store/walletStore";
import { DEFAULT_NETWORKS } from "../../../src/shared/networks";
import { estimateNativeTransfer } from "../utils/evm";

export function SendForm() {
  const activeChainId = useWalletStore((s) => s.activeChainId);
  const customNetworks = useWalletStore((s) => s.customNetworks);
  const unlockedPrivateKey = useWalletStore((s) => s.unlockedPrivateKey);
  const sendNative = useWalletStore((s) => s.sendNative);

  const network = useMemo(
    () => ({ ...DEFAULT_NETWORKS, ...customNetworks })[activeChainId],
    [activeChainId, customNetworks]
  );

  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [gasEstimate, setGasEstimate] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  const onEstimate = async () => {
    if (!unlockedPrivateKey || !network || !to || !amount) return;
    const estimate = await estimateNativeTransfer(unlockedPrivateKey, network, to, amount);
    setGasEstimate(`Gas: ${estimate.gasLimit} | Price: ${estimate.gasPrice || "n/a"}`);
  };

  const onSend = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const hash = await sendNative(to, amount);
      setStatus(`Pending: ${hash.slice(0, 10)}...`);
      setTo("");
      setAmount("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to send");
    }
  };

  return (
    <form className="card space-y-2" onSubmit={onSend}>
      <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">Send Native</h2>
      <input
        className="input"
        value={to}
        onChange={(e) => setTo(e.target.value)}
        placeholder="Recipient address"
        required
      />
      <input
        className="input"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder={`Amount (${network?.nativeCurrency.symbol || "ETH"})`}
        required
      />
      <div className="grid grid-cols-2 gap-2">
        <button className="btn-muted" onClick={onEstimate} type="button">
          Estimate Gas
        </button>
        <button className="btn-primary" type="submit">
          Send
        </button>
      </div>
      {gasEstimate && <p className="text-[11px] text-slate-500 dark:text-slate-300">{gasEstimate}</p>}
      {status && <p className="text-[11px] text-slate-600 dark:text-slate-300">{status}</p>}
    </form>
  );
}
