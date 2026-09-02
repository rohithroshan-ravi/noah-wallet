import { Rocket } from './icons';

export function Hero() {
  return (
    <section className="section text-center">
      <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 card rounded-full">
        <Rocket size={16} className="text-[var(--accent-text)]" />
        <span className="text-sm text-[var(--accent-text)]">The Future of Web3</span>
      </div>

      <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
        Your Gateway to <span className="gradient-text">Web3</span>
      </h1>

      <p className="text-xl text-[var(--text-2)] max-w-2xl mx-auto mb-12">
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
      <div className="grid grid-cols-3 gap-8 mt-16 pt-16 section-divider">
        <div>
          <div className="text-3xl font-bold text-[var(--accent-text)]">100%</div>
          <div className="text-sm text-[var(--text-2)] mt-2">Open Source</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-[var(--accent-text)]">0</div>
          <div className="text-sm text-[var(--text-2)] mt-2">Hidden Fees</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-[var(--accent-text)]">∞</div>
          <div className="text-sm text-[var(--text-2)] mt-2">Possibilities</div>
        </div>
      </div>
    </section>
  );
}
