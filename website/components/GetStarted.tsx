import { ChromeLogo, FirefoxLogo } from './icons';

export function GetStarted() {
  return (
    <section className="section section-divider">
      <div className="bg-gradient-to-r from-[var(--card)] to-[var(--card)]/50 border border-[var(--border)] rounded-3xl p-12 text-center">
        <h2 className="text-4xl font-bold mb-4">Ready to Start?</h2>
        <p className="text-lg text-[var(--text-2)] mb-8 max-w-2xl mx-auto">
          Download Noah Wallet today and take control of your crypto journey.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <button className="btn-primary flex items-center justify-center gap-2">
            <ChromeLogo size={18} />
            Download for Chrome
          </button>
          <button className="btn-secondary flex items-center justify-center gap-2">
            <FirefoxLogo size={18} />
            Download for Firefox
          </button>
        </div>

        <div className="text-sm text-[var(--text-3)] mt-8 pt-8 section-divider">
          <p>Other browsers and mobile versions coming soon</p>
        </div>
      </div>
    </section>
  );
}
