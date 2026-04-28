type JsonRpcRequest = {
  id: string;
  method: string;
  params?: unknown[];
};

type EventHandler = (payload: unknown) => void;

(() => {
  const listeners = new Map<
    string,
    { resolve: (value: unknown) => void; reject: (reason?: unknown) => void }
  >();

  let requestId = 0;

  class NoahEthereumProvider {
    public isNoahWallet = true;
    public selectedAddress: string | null = null;
    public chainId = "0x1";
    private events: Record<string, EventHandler[]> = {};

    constructor() {
      window.addEventListener("message", (event) => {
        if (event.source !== window || !event.data || event.data.target !== "NOAH_INPAGE") return;

        const { id, response, error } = event.data;
        const resolver = listeners.get(id);
        if (!resolver) return;

        listeners.delete(id);
        if (error) {
          resolver.reject(new Error(error.message || "Wallet request failed"));
          return;
        }

        if (response?.method === "eth_accounts" || response?.method === "eth_requestAccounts") {
          this.selectedAddress = response.result?.[0] || null;
          this.emit("accountsChanged", response.result || []);
        }

        if (response?.method === "eth_chainId") {
          this.chainId = response.result;
          this.emit("chainChanged", this.chainId);
        }

        resolver.resolve(response?.result);
      });
    }

    on(event: string, handler: EventHandler) {
      this.events[event] = this.events[event] || [];
      this.events[event].push(handler);
    }

    removeListener(event: string, handler: EventHandler) {
      this.events[event] = (this.events[event] || []).filter((fn) => fn !== handler);
    }

    emit(event: string, payload: unknown) {
      (this.events[event] || []).forEach((handler) => handler(payload));
    }

    request({ method, params }: { method: string; params?: unknown[] }) {
      const id = `${Date.now()}_${requestId++}`;
      const payload: JsonRpcRequest = { id, method, params: params || [] };

      return new Promise((resolve, reject) => {
        listeners.set(id, { resolve, reject });
        window.postMessage({ target: "NOAH_CONTENT", payload }, "*");
      });
    }
  }

  const ethWindow = window as typeof window & { ethereum?: NoahEthereumProvider };
  if (!ethWindow.ethereum) {
    ethWindow.ethereum = new NoahEthereumProvider();
    window.dispatchEvent(new Event("ethereum#initialized"));
  }
})();
