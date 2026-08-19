import HandicapCalculator from '@/components/handicap/HandicapCalculator';
import HandicapGuide from '@/components/handicap/HandicapGuide';
import Breadcrumbs from '@/components/Breadcrumbs';

/**
 * Server component shell. The interactive calculator is the only client
 * boundary; the heading and the guide below it are server-rendered so the SEO
 * content is always in the HTML, never behind a session check.
 */
export default function HandicapPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <Breadcrumbs items={[{ label: 'Handicap Calculator', href: '/handicap' }]} />

      <header className="mb-8">
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-gradient-brand">
          Disc Golf Handicap Calculator
        </h1>
        <p className="mt-3 text-[var(--foreground)]/80 leading-relaxed">
          Work out your disc golf handicap from your PDGA round ratings, your UDisc
          ratings, or plain scores. Free, no account needed - and if you sign in,
          DiscNest saves your rounds and charts your progress over time.
        </p>
      </header>

      <HandicapCalculator />

      <HandicapGuide />
    </main>
  );
}
