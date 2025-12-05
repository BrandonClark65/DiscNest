'use client';

import HomePageLayout from './page-layout';
import HomeHero from '@/components/home/HomeHero';
import HomeValueProposition from '@/components/home/HomeValueProposition';
import HomeFeatures from '@/components/home/HomeFeatures';
import HomeTrustSignals from '@/components/home/HomeTrustSignals';
import HomeFAQ from '@/components/home/HomeFAQ';
import HomeCTA from '@/components/home/HomeCTA';

export default function HomePage() {
  return (
    <HomePageLayout>
      <main className="min-h-screen bg-gradient-to-b from-[var(--background)] via-[var(--surface)] to-[var(--background)] text-foreground">
        <HomeHero />
        <HomeValueProposition />
        <HomeFeatures />
        <HomeTrustSignals />
        <HomeFAQ />
        <HomeCTA />
      </main>
    </HomePageLayout>
  );
}
