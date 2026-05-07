export function Docs() {
  const docs = [
    { title: "Getting Started", url: "#" },
    { title: "Security Guide", url: "#" },
    { title: "API Reference", url: "#" },
    { title: "Troubleshooting", url: "#" },
    { title: "FAQ", url: "#" },
  ];

  return (
    <section id="docs" className="max-w-7xl mx-auto px-6 py-24 border-t border-[#2a2a2a]">
      <h2 className="text-4xl font-bold mb-4 text-center">Documentation</h2>
      <p className="text-center text-[#888] mb-16 max-w-2xl mx-auto">
        Learn how to use Noah Wallet and explore advanced features
      </p>

      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
        {docs.map((doc, idx) => (
          <a
            key={idx}
            href={doc.url}
            className="p-4 bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl hover:border-[#c8ff00] transition text-center"
          >
            <p className="font-medium">{doc.title}</p>
          </a>
        ))}
      </div>

      <div className="mt-16 bg-[#1c1c1c] border border-[#2a2a2a] rounded-2xl p-8">
        <h3 className="text-2xl font-bold mb-4">Need Help?</h3>
        <p className="text-[#888] mb-6">
          Join our community on Discord or GitHub for support and discussions.
        </p>
        <div className="flex gap-4">
          <a href="#" className="btn-secondary">Discord</a>
          <a href="https://github.com/rohithroshan-ravi/noah-wallet" className="btn-secondary">GitHub</a>
        </div>
      </div>
    </section>
  );
}
