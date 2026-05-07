export function GetStarted() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-24 border-t border-[#2a2a2a]">
      <div className="bg-gradient-to-r from-[#1c1c1c] to-[#1c1c1c]/50 border border-[#2a2a2a] rounded-3xl p-12 text-center">
        <h2 className="text-4xl font-bold mb-4">Ready to Start?</h2>
        <p className="text-lg text-[#888] mb-8 max-w-2xl mx-auto">
          Download Noah Wallet today and take control of your crypto journey.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <button className="btn-primary">
            📥 Download for Chrome
          </button>
          <button className="btn-secondary">
            🦊 Download for Firefox
          </button>
        </div>

        <div className="text-sm text-[#555] mt-8 pt-8 border-t border-[#2a2a2a]">
          <p>Other browsers and mobile versions coming soon</p>
        </div>
      </div>
    </section>
  );
}
