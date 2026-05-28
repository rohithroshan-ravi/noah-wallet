export function Features() {
  const features = [
    {
      title: "🔐 Self-Custodial",
      description: "You control your private keys. Your crypto, your way."
    },
    {
      title: "🌐 Multi-Chain Support",
      description: "Manage assets across multiple blockchains seamlessly."
    },
    {
      title: "⚡ Instant Swaps",
      description: "Trade tokens directly from your wallet with best rates."
    },
    {
      title: "🎯 Portfolio Tracking",
      description: "Real-time tracking of your crypto portfolio performance."
    },
    {
      title: "📲 Browser Extension",
      description: "Secure Web3 integration with your favorite dApps."
    },
    {
      title: "🛡️ Bank-Level Security",
      description: "Military-grade encryption to protect your assets."
    },
  ];

  return (
    <section id="features" className="max-w-7xl mx-auto px-6 py-24 border-t border-[#2a2a2a]">
      <h2 className="text-4xl font-bold mb-4 text-center">Features</h2>
      <p className="text-center text-[#888] mb-16 max-w-2xl mx-auto">
        Everything you need for a seamless Web3 experience
      </p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, idx) => (
          <div 
            key={idx}
            className="p-6 bg-[#1c1c1c] border border-[#2a2a2a] rounded-2xl hover:border-[#c8ff00] transition"
          >
            <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
            <p className="text-sm text-[#888]">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
