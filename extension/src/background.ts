import { ethers } from "ethers";
import { DEFAULT_NETWORKS, type EvmNetwork } from "./shared/networks";

type WalletSessionUpdate = {
  address: string | null;
  unlockedPrivateKey: string | null;
  activeChainId?: string;
};

type RuntimeState = {
  address: string | null;
  activeChainId: string;
  unlockedPrivateKey: string | null;
  customNetworks: Record<string, EvmNetwork>;
};

const STATE: RuntimeState = {
  address: null,
  activeChainId: "0x1",
  unlockedPrivateKey: null,
  customNetworks: {}
};

async function hydrateState() {
  const data = await chrome.storage.local.get(["walletSession", "customNetworks", "activeChainId"]);
  if (data.walletSession?.address) STATE.address = data.walletSession.address;
  if (data.activeChainId) STATE.activeChainId = data.activeChainId;
  STATE.customNetworks = data.customNetworks || {};
}

function getNetworkMap() {
  return { ...DEFAULT_NETWORKS, ...STATE.customNetworks };
}

function ensureUnlocked() {
  if (!STATE.unlockedPrivateKey) throw new Error("Wallet is locked");
}

async function getProvider(chainId: string) {
  const network = getNetworkMap()[chainId];
  if (!network?.rpcUrls?.length) throw new Error("Unsupported chain");
  return new ethers.JsonRpcProvider(network.rpcUrls[0], Number(chainId));
}

async function switchChain(chainId: string) {
  if (!getNetworkMap()[chainId]) throw new Error("Unknown chainId");
  STATE.activeChainId = chainId;
  await chrome.storage.local.set({ activeChainId: chainId });
}

async function estimateGas(params: ethers.TransactionRequest) {
  const provider = await getProvider(STATE.activeChainId);
  const gasLimit = await provider.estimateGas(params);
  const feeData = await provider.getFeeData();

  return {
    gasLimit: gasLimit.toString(),
    gasPrice: feeData.gasPrice?.toString() || null,
    maxFeePerGas: feeData.maxFeePerGas?.toString() || null,
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString() || null
  };
}

async function sendTransaction(params: ethers.TransactionRequest) {
  ensureUnlocked();
  const provider = await getProvider(STATE.activeChainId);
  const signer = new ethers.Wallet(STATE.unlockedPrivateKey as string, provider);
  const tx = await signer.sendTransaction(params);
  return tx.hash;
}

async function signMessage(hexOrUtf8Message: string) {
  ensureUnlocked();
  const signer = new ethers.Wallet(STATE.unlockedPrivateKey as string);

  const message = hexOrUtf8Message.startsWith("0x")
    ? ethers.getBytes(hexOrUtf8Message)
    : hexOrUtf8Message;

  return signer.signMessage(message);
}

async function handleProviderRequest(payload: { method: string; params?: unknown[] }) {
  const { method, params = [] } = payload;

  switch (method) {
    case "eth_chainId":
      return { method, result: STATE.activeChainId };

    case "eth_accounts":
    case "eth_requestAccounts":
      return { method, result: STATE.address ? [STATE.address] : [] };

    case "wallet_switchEthereumChain": {
      const [args] = params as [{ chainId: string }];
      await switchChain(args.chainId);
      return { method, result: null };
    }

    case "wallet_addEthereumChain": {
      const [network] = params as [EvmNetwork];
      if (!network?.chainId || !network?.rpcUrls?.length) throw new Error("Invalid network payload");
      STATE.customNetworks[network.chainId] = network;
      await chrome.storage.local.set({ customNetworks: STATE.customNetworks });
      return { method, result: null };
    }

    case "eth_estimateGas": {
      const [tx] = params as [ethers.TransactionRequest];
      return { method, result: await estimateGas(tx) };
    }

    case "eth_sendTransaction": {
      const [tx] = params as [ethers.TransactionRequest];
      return { method, result: await sendTransaction(tx) };
    }

    case "personal_sign": {
      const [message] = params as [string];
      return { method, result: await signMessage(message) };
    }

    default:
      throw new Error(`Unsupported method: ${method}`);
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  await hydrateState();
  chrome.alarms.create("wallet_autolock", { periodInMinutes: 1 });
  await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

chrome.runtime.onStartup.addListener(hydrateState);

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== "wallet_autolock") return;
  const { lockAt } = await chrome.storage.local.get("lockAt");
  if (!lockAt) return;

  if (Date.now() >= lockAt) {
    STATE.unlockedPrivateKey = null;
    await chrome.storage.local.set({ unlocked: false });
  }
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "NOAH_PROVIDER_REQUEST") {
    handleProviderRequest(msg.payload)
      .then(sendResponse)
      .catch((error) => sendResponse({ error: { message: error.message } }));
    return true;
  }

  if (msg.type === "NOAH_SESSION_UPDATE") {
    const payload = msg as WalletSessionUpdate;
    STATE.address = payload.address;
    STATE.unlockedPrivateKey = payload.unlockedPrivateKey;
    if (payload.activeChainId) STATE.activeChainId = payload.activeChainId;
    sendResponse({ ok: true });
    return false;
  }

  return false;
});
