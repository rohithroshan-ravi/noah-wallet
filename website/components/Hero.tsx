export function Hero() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-24 text-center">
      <div className="mb-6 inline-block px-4 py-2 bg-[#1c1c1c] border border-[#2a2a2a] rounded-full">
        <span className="text-sm text-[#c8ff00]">🚀 The Future of Web3</span>
      </div>
      
      <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
        Your Gateway to <span className="gradient-text">Web3</span>
      </h1>
      
      <p className="text-xl text-[#888] max-w-2xl mx-auto mb-12">
        Noah Wallet is a secure, user-friendly crypto wallet designed for everyone. 
        Manage your digital assets, swap tokens, and explore the decentralized web with confidence.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
        <button className="btn-primary">
          Download Now
        </button>
        <button className="btn-secondary">
          View Documentation
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-8 mt-16 pt-16 border-t border-[#2a2a2a]">
        <div>
          <div className="text-3xl font-bold text-[#c8ff00]">100%</div>
          <div className="text-sm text-[#888] mt-2">Open Source</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-[#c8ff00]">0</div>
          <div className="text-sm text-[#888] mt-2">Hidden Fees</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-[#c8ff00]">∞</div>
          <div className="text-sm text-[#888] mt-2">Possibilities</div>
        </div>
      </div>
    </section>
  );
}
