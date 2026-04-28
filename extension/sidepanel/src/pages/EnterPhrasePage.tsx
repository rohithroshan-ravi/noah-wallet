import { useState } from "react";
import { ArrowLeft, Upload, ClipboardPaste } from "../components/Icons";
import { useWalletStore } from "../store/walletStore";

const GRID = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

type Props = {
  onBack: () => void;
  onContinue: () => void;
};

export function EnterPhrasePage({ onBack, onContinue }: Props) {
  const setPendingSecret = useWalletStore((s) => s.setPendingSecret);
  const [words, setWords] = useState<string[]>(Array(12).fill(""));
  const [len, setLen] = useState<12 | 24>(12);

  const grid = len === 12 ? GRID : [...GRID, ...Array(12).fill(0).map((_, i) => i + 12)];

  const update = (i: number, val: string) => {
    const next = [...words];
    next[i] = val.trim();
    setWords(next);
  };

  const handlePaste = async () => {
    const text = await navigator.clipboard.readText();
    const split = text.trim().split(/\s+/).slice(0, len);
    setWords([...split, ...Array(Math.max(0, len - split.length)).fill("")]);
  };

  const ready = words.slice(0, len).every((w) => w.length > 0);

  const handleContinue = () => {
    setPendingSecret(words.slice(0, len).join(" "));
    onContinue();
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#0d0d0d] px-5 pt-5">
      <button className="mb-6 self-start" onClick={onBack}>
        <ArrowLeft />
      </button>

      <h1 className="mb-1 text-2xl font-extrabold text-white">Enter Your Recovery Phrase</h1>
      <p className="mb-5 text-sm text-[#888]">
        Your recovery phrase is the key to the wallet.
      </p>

      {/* 12 / 24 toggle */}
      <div className="mb-4 flex w-24 rounded-xl bg-[#1c1c1c] border border-[#2a2a2a] p-0.5">
        {([12, 24] as const).map((n) => (
          <button
            key={n}
            className={`flex-1 rounded-lg py-1 text-xs font-semibold transition ${
              len === n ? "bg-[#c8ff00] text-black" : "text-[#888]"
            }`}
            onClick={() => {
              setLen(n);
              setWords(Array(n).fill(""));
            }}
          >
            {n}
          </button>
        ))}
      </div>

      {/* Word grid */}
      <div className={`grid gap-2 ${len === 24 ? "grid-cols-3" : "grid-cols-3"}`}>
        {grid.map((_, i) => (
          <div key={i} className="word-chip">
            <span className="idx">{i + 1}</span>
            <input
              className="w-full bg-transparent text-xs text-white outline-none placeholder-[#444]"
              placeholder="word"
              value={words[i] ?? ""}
              onChange={(e) => update(i, e.target.value)}
            />
          </div>
        ))}
      </div>

      {/* Upload / Paste */}
      <div className="mt-4 flex gap-3">
        <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#2a2a2a] py-2.5 text-xs text-[#888] hover:text-white transition">
          <Upload size={14} /> Upload
        </button>
        <button
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#2a2a2a] py-2.5 text-xs text-[#888] hover:text-white transition"
          onClick={handlePaste}
        >
          <ClipboardPaste size={14} /> Paste
        </button>
      </div>

      <div className="mt-auto pb-10 pt-6">
        <button className="btn-lime" disabled={!ready} onClick={handleContinue}>
          Continue
        </button>
        <button className="btn-ghost mt-2" onClick={onBack}>
          Create New Wallet
        </button>
      </div>
    </div>
  );
}
