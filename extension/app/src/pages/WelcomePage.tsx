import { TokenBNB, TokenBTC, TokenSOL, TokenUSDT } from "../components/Icons";

type Props = {
  onGetStarted: () => void;
  onUseExisting: () => void;
};

export function WelcomePage({ onGetStarted, onUseExisting }: Props) {
  return (
    <div className="panel-shell">
      {/* Hero */}
      <div className="flex flex-1 flex-col items-center justify-center px-8 pb-12 pt-16 text-center">
        {/* Token icons cluster */}
        <div className="relative mb-10 h-36 w-36">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-16 w-16 rounded-full border border-[#2a2a2a] overflow-hidden">
            <TokenBTC size={64} />
          </div>
          <div className="absolute top-0 right-0 h-11 w-11 rounded-full border border-[#2a2a2a] overflow-hidden">
            <TokenUSDT size={44} />
          </div>
          <div className="absolute bottom-0 left-2 h-10 w-10 rounded-full border border-[#2a2a2a] overflow-hidden">
            <TokenSOL size={40} />
          </div>
          <div className="absolute top-4 left-0 h-9 w-9 rounded-full border border-[#2a2a2a] overflow-hidden">
            <TokenBNB size={36} />
          </div>
        </div>

        <h1 className="mb-3 text-3xl font-extrabold leading-tight text-white">
          Start Your<br />Web3 Journey
        </h1>
        <p className="text-sm leading-relaxed text-[#888]">
          All you need to access the Web3 world —<br />right in your pocket.
        </p>
      </div>

      {/* Actions */}
      <div className="px-6 pb-10 space-y-3">
        <button className="btn-lime" onClick={onGetStarted}>
          Get Started
        </button>
        <button className="btn-ghost" onClick={onUseExisting}>
          Use Existing Wallet
        </button>
      </div>
    </div>
  );
}
