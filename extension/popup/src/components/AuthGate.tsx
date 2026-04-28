import { FormEvent, useState } from "react";
import { useWalletStore } from "../store/walletStore";

type Tab = "create" | "importPk" | "importSeed" | "unlock";

export function AuthGate() {
  const wallet = useWalletStore((s) => s.wallet);
  const loading = useWalletStore((s) => s.loading);
  const error = useWalletStore((s) => s.error);
  const createWallet = useWalletStore((s) => s.createWallet);
  const importWithPrivateKey = useWalletStore((s) => s.importWithPrivateKey);
  const importWithMnemonic = useWalletStore((s) => s.importWithMnemonic);
  const unlockWallet = useWalletStore((s) => s.unlockWallet);

  const [tab, setTab] = useState<Tab>(wallet ? "unlock" : "create");
  const [password, setPassword] = useState("");
  const [secret, setSecret] = useState("");

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!password) return;

    if (tab === "create") await createWallet(password);
    if (tab === "importPk") await importWithPrivateKey(secret, password);
    if (tab === "importSeed") await importWithMnemonic(secret, password);
    if (tab === "unlock") await unlockWallet(password);

    setSecret("");
    setPassword("");
  };

  return (
    <div className="p-4">
      <div className="card space-y-4">
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">Noah Wallet</h1>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <button className="btn-muted" onClick={() => setTab("create")}>Create</button>
          <button className="btn-muted" onClick={() => setTab("unlock")}>Unlock</button>
          <button className="btn-muted" onClick={() => setTab("importPk")}>Import PK</button>
          <button className="btn-muted" onClick={() => setTab("importSeed")}>Import Seed</button>
        </div>

        <form className="space-y-3" onSubmit={onSubmit}>
          {(tab === "importPk" || tab === "importSeed") && (
            <textarea
              className="input min-h-24"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder={tab === "importPk" ? "Private key (0x...)" : "Seed phrase"}
              required
            />
          )}

          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            minLength={8}
            required
          />

          {error && <p className="text-xs text-coral">{error}</p>}

          <button className="btn-primary w-full" disabled={loading} type="submit">
            {loading ? "Working..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
