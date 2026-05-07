import { Navigation } from '@/components/Navigation';
import { Hero } from '@/components/Hero';
import { Features } from '@/components/Features';
import { GetStarted } from '@/components/GetStarted';
import { Docs } from '@/components/Docs';
import { Footer } from '@/components/Footer';

export default function Home() {
  return (
    <div className="bg-[#0d0d0d] min-h-screen">
      <Navigation />
      <Hero />
      <Features />
      <GetStarted />
      <Docs />
      <Footer />
    </div>
  );
}
