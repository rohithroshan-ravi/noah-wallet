import type { ComponentType } from 'react';
import { Lock, Globe, Zap, Target, Smartphone, Shield } from './icons';

const FEATURES: { title: string; description: string; Icon: ComponentType<{ size?: number; className?: string }> }[] = [
  {
    title: 'Self-Custodial',
    description: 'You control your private keys. Your crypto, your way.',
    Icon: Lock,
  },
  {
    title: 'Multi-Chain Support',
    description: 'Manage assets across multiple blockchains seamlessly.',
    Icon: Globe,
  },
  {
    title: 'Instant Swaps',
    description: 'Trade tokens directly from your wallet with best rates.',
    Icon: Zap,
  },
  {
    title: 'Portfolio Tracking',
    description: 'Real-time tracking of your crypto portfolio performance.',
    Icon: Target,
  },
  {
    title: 'Browser Extension',
    description: 'Secure Web3 integration with your favorite dApps.',
    Icon: Smartphone,
  },
  {
    title: 'Bank-Level Security',
    description: 'Military-grade encryption to protect your assets.',
    Icon: Shield,
  },
];

export function Features() {
  return (
    <section id="features" className="section section-divider">
      <h2 className="text-4xl font-bold mb-4 text-center">Features</h2>
      <p className="text-center text-[#888] mb-16 max-w-2xl mx-auto">
        Everything you need for a seamless Web3 experience
      </p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {FEATURES.map(({ title, description, Icon }) => (
          <div
            key={title}
            className="p-6 card hover:border-[#c8ff00] transition"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#c8ff0020] text-[#c8ff00]">
              <Icon size={20} />
            </div>
            <h3 className="text-lg font-bold mb-2">{title}</h3>
            <p className="text-sm text-[#888]">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
