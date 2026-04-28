import { DEFAULT_NETWORKS } from "../../../src/shared/networks";
import { useWalletStore } from "../store/walletStore";

export function NetworkSelector() {
  const activeChainId = useWalletStore((s) => s.activeChainId);
  const customNetworks = useWalletStore((s) => s.customNetworks);
  const setActiveChain = useWalletStore((s) => s.setActiveChain);

  const allNetworks = { ...DEFAULT_NETWORKS, ...customNetworks };

  return (
    <select
      className="input"
      value={activeChainId}
      onChange={(event) => void setActiveChain(event.target.value)}
    >
      {Object.values(allNetworks).map((network) => (
        <option key={network.chainId} value={network.chainId}>
          {network.chainName}
        </option>
      ))}
    </select>
  );
}
