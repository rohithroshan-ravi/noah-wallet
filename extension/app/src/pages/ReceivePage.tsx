import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, Copy } from "../components/Icons";
import { useWalletStore } from "../store/walletStore";

type Props = { onBack: () => void };

export function ReceivePage({ onBack }: Props) {
  const account = useWalletStore((s) => s.account) ?? "";
  const ref = useRef<HTMLDivElement>(null);

  const copy = () => navigator.clipboard.writeText(account);

  return (
    <div className="panel-shell px-5 pt-5">
      <button className="mb-6 self-start" onClick={onBack}>
        <ArrowLeft />
      </button>

      <h1 className="mb-1 text-xl font-extrabold text-white">Receive</h1>
      <p className="mb-8 text-sm text-[#888]">
        Share this address to receive any EVM tokens.
      </p>

      {/* QR */}
      <div className="flex flex-col items-center">
        <div ref={ref} className="rounded-2xl bg-white p-5">
          <QRCodeSVG value={account} size={200} />
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm font-semibold text-white">Noah Wallet</p>
          <p className="mt-1 break-all text-[11px] text-[#888]">{account}</p>
        </div>
      </div>

      <div className="mt-auto pb-10 pt-8">
        <button className="btn-lime flex items-center justify-center gap-2" onClick={copy}>
          <Copy size={16} />
          Copy Address
        </button>
      </div>
    </div>
  );
}
