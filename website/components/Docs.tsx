import { Github } from './icons';

const DOCS = [
  { title: 'Getting Started', url: '#' },
  { title: 'Security Guide', url: '#' },
  { title: 'API Reference', url: '#' },
  { title: 'Troubleshooting', url: '#' },
  { title: 'FAQ', url: '#' },
];

export function Docs() {
  return (
    <section id="docs" className="section section-divider">
      <h2 className="text-4xl font-bold mb-4 text-center">Documentation</h2>
      <p className="text-center text-[#888] mb-16 max-w-2xl mx-auto">
        Learn how to use Noah Wallet and explore advanced features
      </p>

      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
        {DOCS.map((doc) => (
          <a
            key={doc.title}
            href={doc.url}
            className="p-4 card hover:border-[#c8ff00] transition text-center"
          >
            <p className="font-medium">{doc.title}</p>
          </a>
        ))}
      </div>

      <div className="mt-16 card p-8">
        <h3 className="text-2xl font-bold mb-4">Need Help?</h3>
        <p className="text-[#888] mb-6">
          Join our community on Discord or GitHub for support and discussions.
        </p>
        <div className="flex gap-4">
          <a href="#" className="btn-secondary">Discord</a>
          <a
            href="https://github.com/rohithroshan-ravi/noah-wallet"
            className="btn-secondary flex items-center gap-2"
          >
            <Github size={16} />
            GitHub
          </a>
        </div>
      </div>
    </section>
  );
}
