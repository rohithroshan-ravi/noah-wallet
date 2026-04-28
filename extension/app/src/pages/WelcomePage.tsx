type Props = {
  onGetStarted: () => void;
  onUseExisting: () => void;
};

export function WelcomePage({ onGetStarted, onUseExisting }: Props) {
  return (
    <div className="flex min-h-screen flex-col bg-[#0d0d0d]">
      {/* Hero */}
      <div className="flex flex-1 flex-col items-center justify-center px-8 pb-12 pt-16 text-center">
        {/* Token icons cluster */}
        <div className="relative mb-10 h-36 w-36">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-16 w-16 rounded-full bg-[#1c1c1c] border border-[#2a2a2a] flex items-center justify-center text-3xl">
            ₿
          </div>
          <div className="absolute top-0 right-0 h-11 w-11 rounded-full bg-[#1c1c1c] border border-[#2a2a2a] flex items-center justify-center text-xl">
            <span style={{ color: "#26A17B" }}>₮</span>
          </div>
          <div className="absolute bottom-0 left-2 h-10 w-10 rounded-full bg-[#1c1c1c] border border-[#2a2a2a] flex items-center justify-center text-lg">
            <span style={{ color: "#9945FF" }}>◎</span>
          </div>
          <div className="absolute top-4 left-0 h-9 w-9 rounded-full bg-[#1c1c1c] border border-[#2a2a2a] flex items-center justify-center text-base">
            <span style={{ color: "#F0B90B" }}>⬡</span>
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
