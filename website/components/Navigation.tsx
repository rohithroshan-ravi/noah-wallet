export function Navigation() {
  return (
    <nav className="border-b border-[#2a2a2a] sticky top-0 bg-[#0d0d0d]/95 backdrop-blur z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo-sm.svg" alt="Noah Wallet" className="w-8 h-8" />
          <span className="font-bold text-lg text-white">Noah Wallet</span>
        </div>
        
        <div className="flex items-center gap-8">
          <a href="#features" className="text-sm text-[#888] hover:text-white transition">Features</a>
          <a href="#docs" className="text-sm text-[#888] hover:text-white transition">Documentation</a>
          <a href="https://github.com/rohithroshan-ravi/noah-wallet" className="text-sm text-[#888] hover:text-white transition">GitHub</a>
          <button className="btn-primary text-sm">
            Download
          </button>
        </div>
      </div>
    </nav>
  );
}
