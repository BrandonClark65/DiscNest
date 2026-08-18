import { notFound } from 'next/navigation';
import { Info } from 'lucide-react';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { calculateForUser } from '@/lib/handicap/handicapService';
import { ratingHistory, type ScoredRound } from '@/lib/handicap/handicapUtils';
import { MIN_ROUNDS_ESTABLISHED } from '@/app/constants/handicapConfig';
import RoundsList from '@/components/handicap/RoundsList';
import RatingChart from '@/components/handicap/RatingChart';
import ShareButton from '@/components/ui/ShareButton';
import GradientButton from '@/components/ui/GradientButton';

// Canonical host: matches src/app/layout.tsx and the www redirect in middleware.
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.discnest.com';

const cardClass =
  'bg-[var(--surface)] p-5 rounded-2xl shadow-md border border-[var(--muted)]/30';

/** The share id is unguessable but the page is still public, so keep it out of the index. */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return {
    title: 'Shared Disc Golf Handicap | DiscNest',
    description: 'A disc golf rating and handicap shared from DiscNest.',
    openGraph: {
      title: 'Disc Golf Handicap | DiscNest',
      description: 'See this player’s DiscNest rating and handicap.',
      url: `${baseUrl}/share/handicap/${id}`,
      images: [`${baseUrl}/og-handicap.png`],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Disc Golf Handicap | DiscNest',
      description: 'See this player’s DiscNest rating and handicap.',
      images: [`${baseUrl}/og-handicap.png`],
    },
    alternates: {
      canonical: `${baseUrl}/share/handicap/${id}`,
    },
    robots: { index: false, follow: false },
  };
}

export default async function SharedHandicapPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await connectToDatabase();

  const user = (await User.findOne({ shareableHandicapId: id })
    .select('name')
    .lean()) as { _id: { toString(): string }; name?: string } | null;

  if (!user) return notFound();

  // Same service the owner's own page uses, so the shared numbers can never
  // disagree with what the player sees.
  const { result, rounds } = await calculateForUser(user._id.toString());
  if (rounds.length === 0) return notFound();

  const scored: ScoredRound[] = rounds.map((r) => ({
    rating: r.computedRating,
    date: r.date,
    holes: r.holes,
    estimated: r.estimated,
  }));
  const history = ratingHistory(scored);

  const playerName = user.name || 'A DiscNest player';
  const shareUrl = `${baseUrl}/share/handicap/${id}`;

  // Unsigned on purpose - see the comment in HandicapSummary. "+8" reads as
  // better than scratch in golf, which is the opposite of what it means here.
  const throws = result.handicapThrows ?? 0;
  const throwsLabel = throws < 0 ? 'Throws given back' : 'Throws received';

  return (
    <main className="max-w-4xl mx-auto px-4 py-10 space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-gradient-brand">
            {playerName}&apos;s disc golf handicap
          </h1>
          <p className="mt-2 text-[var(--foreground)]/75">
            Calculated by DiscNest from {result.sampleSize} recent round
            {result.sampleSize === 1 ? '' : 's'}.
          </p>
        </div>
        <ShareButton
          title={`${playerName}'s disc golf handicap`}
          text={
            result.rating != null
              ? `${playerName} is rated ${result.rating} on DiscNest.`
              : `See ${playerName}'s rounds on DiscNest.`
          }
          url={shareUrl}
        />
      </header>

      <section className={cardClass}>
        {result.rating == null ? (
          <p className="text-[var(--foreground)]/70">
            Not enough rounds yet to show a rating - DiscNest needs a few before the
            number means anything.
          </p>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <h2 className="font-heading text-xl font-semibold text-[var(--foreground)]">
                Handicap
              </h2>
              <span
                className={`text-xs px-3 py-1 rounded-full font-medium ${
                  result.provisional
                    ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                    : 'bg-[var(--primary)]/15 text-[var(--primary)]'
                }`}
              >
                {result.provisional
                  ? `Provisional · ${result.sampleSize}/${MIN_ROUNDS_ESTABLISHED} rounds`
                  : `Established · ${result.sampleSize} rounds`}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <div className="text-4xl font-heading font-bold text-gradient-brand">
                  {result.rating}
                </div>
                <div className="text-xs uppercase tracking-wide text-[var(--foreground)]/60 mt-1">
                  DiscNest Rating
                </div>
              </div>
              <div>
                <div className="text-4xl font-heading font-bold text-[var(--foreground)]">
                  {Math.abs(throws)}
                </div>
                <div className="text-xs uppercase tracking-wide text-[var(--foreground)]/60 mt-1">
                  {throwsLabel} vs {result.targetRating}
                </div>
              </div>
            </div>

            <p className="mt-4 text-xs text-[var(--foreground)]/60">
              Based on the best {result.countedRounds} of the last {result.sampleSize}{' '}
              round{result.sampleSize === 1 ? '' : 's'}.
            </p>
          </>
        )}

        <p className="mt-3 flex items-start gap-2 text-xs text-[var(--foreground)]/60">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          A DiscNest Rating is not a PDGA rating. It uses the same 1000 scale so it
          reads the same way, but it&apos;s built from self-entered rounds.
        </p>
      </section>

      {history.length > 0 && (
        <section className={cardClass}>
          <h2 className="font-heading text-xl font-semibold text-[var(--foreground)] mb-1">
            Progress
          </h2>
          <p className="text-xs text-[var(--foreground)]/60 mb-4">
            The rating as it stood after each round played.
          </p>
          <RatingChart history={history} />
        </section>
      )}

      <RoundsList
        rounds={rounds}
        countedIndices={result.countedIndices}
        title="Recent rounds"
        caption="A star marks the rounds counting toward this rating."
        emptyMessage="No rounds to show."
      />

      <section className={`${cardClass} text-center`}>
        <h2 className="font-heading text-xl font-semibold text-[var(--foreground)] mb-2">
          Work out your own handicap
        </h2>
        <p className="text-[var(--foreground)]/70 mb-4">
          Free, no account needed - enter PDGA or UDisc round ratings, or plain scores.
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
