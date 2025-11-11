'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, RefreshCcw, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import type { RecommendedDisc } from '@/lib/recommendations';
import DiscCardGear from '@/components/gear/DiscCardGear';
import GradientButton from '@/components/ui/GradientButton';

type PersonalizedRecommendationsProps = {
  title?: string;
  className?: string;
};

export default function PersonalizedRecommendations({
  title = 'Personalized Disc Recommendations',
  className = '',
}: PersonalizedRecommendationsProps) {
  const [recs, setRecs] = useState<RecommendedDisc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  async function fetchRecommendations() {
    try {
      setLoading(true);
      const res = await fetch('/api/recommendations', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch recommendations');
      const data = (await res.json()) as RecommendedDisc[];

      // --- Step 1: Deduplicate by name + brand ---
      const uniqueDiscs = data.filter(
        (disc, index, arr) =>
          index === arr.findIndex((d) => d.name === disc.name && d.brand === disc.brand)
      );

      // --- Step 2: Pick diverse reasons ---
      const seenReasons = new Set<string>();
      const diverse: RecommendedDisc[] = [];
      for (const disc of uniqueDiscs) {
        const firstReason = disc.reasons?.[0]?.type;
        if (firstReason && !seenReasons.has(firstReason)) {
          diverse.push(disc);
          seenReasons.add(firstReason);
        }
        if (diverse.length >= 4) break;
      }

      // --- Step 3: Fill remaining slots if fewer than 4 ---
      const filled =
        diverse.length < 4
          ? [...diverse, ...uniqueDiscs.filter((d) => !diverse.includes(d)).slice(0, 4 - diverse.length)]
          : diverse;

      setRecs(filled.slice(0, 4));
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Could not load recommendations.');
      toast.error('Failed to fetch recommendations');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRecommendations();
  }, []);

  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`bg-[var(--surface)]/60 border border-[var(--muted)]/40 rounded-xl p-5 shadow-sm mt-8 ${className}`}
    >
      {/* Header with toggle */}
      <div className="flex items-center justify-between mb-2">
        <div
          className="flex items-center gap-2 cursor-pointer select-none"
          onClick={() => setExpanded((prev) => !prev)}
        >
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="w-5 h-5 text-[var(--primary)]" />
            {title}
          </h3>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-[var(--muted-foreground)]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)]" />
          )}
        </div>

        <GradientButton
          label="Refresh"
          onClick={fetchRecommendations}
          icon={loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
          variant="muted"
          className="text-xs px-3 py-1.5"
        />
      </div>

      {/* Collapsible content */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="recommendations-content"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {/* Loading / Error */}
            {loading && (
              <p className="text-sm text-[var(--muted-foreground)] mt-2">Loading recommendations...</p>
            )}
            {error && <p className="text-sm text-rose-500 mt-2">{error}</p>}

            {/* Empty state */}
            {!loading && !error && recs.length === 0 && (
              <p className="text-sm text-[var(--muted-foreground)] italic mt-2">
                No personalized recommendations right now. Try updating your bag or profile preferences.
              </p>
            )}

            {/* Recommendations grid */}
            {!loading && recs.length > 0 && (
              <div
                className="grid gap-6 justify-center grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mt-4"
                style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}
              >
                {recs.map((disc, index) => (
                  <motion.div
                    key={`${disc._id}-${disc.reasons?.[0]?.type || 'rec'}-${index}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="flex flex-col"
                  >
                    {/* Read-only DiscCard */}
                    <div
                      className="relative group rounded-xl overflow-visible bg-gradient-to-br from-indigo-50/80 to-blue-50/80 
                                  dark:from-slate-800/60 dark:to-slate-900/60 border border-[var(--muted)]/40 
                                  shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
                    >
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 
                                    bg-gradient-to-br from-indigo-200/10 to-blue-300/10 blur-md"
                      />
                      <div className="relative z-10 flex flex-col items-center justify-center">
                        <DiscCardGear disc={disc} compact />
                        <div
                          className="
                            mt-2 text-xs space-y-1 p-2 text-center
                            text-neutral-700 dark:text-neutral-300
                          "
                        >
                          {disc.reasons?.slice(0, 2).map((r, i) => (
                            <p key={i}>
                              <strong className="font-semibold text-neutral-800 dark:text-neutral-200">
                                {r.type.replace(/_/g, ' ')}:
                              </strong>{' '}
                              {r.explanation}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
