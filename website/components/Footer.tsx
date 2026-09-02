export function Footer() {
  return (
    <footer className="section-divider py-12 mt-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src="/logo-sm.svg" alt="Noah Wallet" className="w-8 h-8" />
              <span className="font-bold">Noah Wallet</span>
            </div>
            <p className="text-sm text-[var(--text-2)]">
              A secure, user-friendly gateway to Web3
            </p>
          </div>

          <div>
            <h4 className="font-bold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-[var(--text-2)]">
              <li><a href="#" className="hover:text-[var(--text-1)] transition">Features</a></li>
              <li><a href="#" className="hover:text-[var(--text-1)] transition">Download</a></li>
              <li><a href="#" className="hover:text-[var(--text-1)] transition">Roadmap</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Developer</h4>
            <ul className="space-y-2 text-sm text-[var(--text-2)]">
              <li><a href="#" className="hover:text-[var(--text-1)] transition">Documentation</a></li>
              <li><a href="https://github.com/rohithroshan-ravi/noah-wallet" className="hover:text-[var(--text-1)] transition">GitHub</a></li>
              <li><a href="#" className="hover:text-[var(--text-1)] transition">API</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Community</h4>
            <ul className="space-y-2 text-sm text-[var(--text-2)]">
              <li><a href="#" className="hover:text-[var(--text-1)] transition">Discord</a></li>
              <li><a href="#" className="hover:text-[var(--text-1)] transition">Twitter</a></li>
              <li><a href="#" className="hover:text-[var(--text-1)] transition">Telegram</a></li>
            </ul>
          </div>
        </div>

        <div className="section-divider pt-8 text-center text-sm text-[var(--text-3)]">
          <p>&copy; 2026 Noah Wallet. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
