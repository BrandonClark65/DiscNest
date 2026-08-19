import type { Metadata } from 'next';
import Breadcrumbs from '@/components/Breadcrumbs';
import GradientButton from '@/components/ui/GradientButton';
import { getActivePros, getProBySlug } from '@/lib/pros/proService';
import { throwsFromPro } from '@/lib/handicap/proComparison';
import { RATING_FLOOR, RATING_CEILING } from '@/app/constants/handicapConfig';
import ProsExplorer from './ProsExplorer';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.discnest.com';

// The base page is static-ish (pros change monthly); query params personalize it.
export const revalidate = 3600;

type SearchParams = Promise<{ vs?: string; r?: string }>;

function parseRating(raw?: string): number | null {
  if (raw == null) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < RATING_FLOOR || n > RATING_CEILING) return null;
  return Math.round(n);
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { vs, r } = await searchParams;
  const rating = parseRating(r);
  const pro = vs ? await getProBySlug(vs) : null;

  // A shared link previews with the visitor's own number when we have both a
  // pro and a rating; otherwise it falls back to the generic card.
  let title = 'How Many Throws Would You Get From a Pro? | DiscNest';
  let description =
    'See how many throws the top disc golf pros would spot you, based on your rating. Free on DiscNest.';
  let ogImage = `${baseUrl}/api/og/pro-handicap`;

  if (pro && rating != null) {
    const { throws } = throwsFromPro(rating, pro.rating);
    const magnitude = Math.abs(throws);
    const line =
      throws >= 0
        ? `I'd get ${magnitude} throw${magnitude === 1 ? '' : 's'} from ${pro.name}`
        : `I'd spot ${pro.name} ${magnitude} throw${magnitude === 1 ? '' : 's'}`;
    title = `${line} | DiscNest`;
    description = `${line}. How many would you get? Find out on DiscNest.`;
    ogImage = `${baseUrl}/api/og/pro-handicap?vs=${encodeURIComponent(vs!)}&r=${rating}`;
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${baseUrl}/handicap/pros`,
      type: 'website',
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    // Query variants all point at the clean canonical, so search engines index
    // one page rather than a rating for every visitor.
    alternates: { canonical: `${baseUrl}/handicap/pros` },
    robots: { index: true, follow: true },
  };
}

export default async function ProsPage({ searchParams }: { searchParams: SearchParams }) {
  const { vs, r } = await searchParams;
  const pros = await getActivePros();
  const rating = parseRating(r);

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <Breadcrumbs
        items={[
          { label: 'Handicap Calculator', href: '/handicap' },
          { label: 'Pros', href: '/handicap/pros' },
        ]}
      />

      <header className="mb-8">
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-gradient-brand">
          How many throws would you get from a pro?
        </h1>
        <p className="mt-3 text-[var(--foreground)]/80 leading-relaxed">
          Enter your rating and pick a touring pro to see how many throws they would spot
          you over 18 holes. Share your result, then send it to someone who thinks they are
          closer to the top than you are.
        </p>
      </header>

      {pros.length === 0 ? (
        <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--muted)]/30 text-center">
          <p className="text-[var(--foreground)]/70">
            Pro ratings are not available right now. Check back soon.
          </p>
          <div className="mt-4">
            <GradientButton
              label="Open the handicap calculator"
              href="/handicap"
              variant="primary"
              className="px-5 py-2"
            />
          </div>
        </div>
      ) : (
        <ProsExplorer pros={pros} initialVs={vs} initialR={rating ?? undefined} />
      )}

      <section className="bg-[var(--surface)] p-5 rounded-2xl shadow-md border border-[var(--muted)]/30 text-center mt-8">
        <h2 className="font-heading text-xl font-semibold text-[var(--foreground)] mb-2">
          Want your real number?
        </h2>
        <p className="text-[var(--foreground)]/70 mb-4">
          Enter a few rounds and DiscNest works out your rating, free and with no account
          needed.
        </p>
        <GradientButton
          label="Open the handicap calculator"
          href="/handicap"
          variant="primary"
          className="px-5 py-2"
        />
      </section>
    </main>
  );
}
