'use client';

import { motion } from 'framer-motion';
import { Brain, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { Disc } from '@/types/disc';

function analyzeBagGaps(bag: Disc[]) {
  if (!bag.length) {
    return { missing: [], overrepresented: [], avgSpeed: null, suggestions: [] };
  }

  const types = ['Putter', 'Midrange', 'Fairway Driver', 'Distance Driver'];
  const typeCounts: Record<string, number> = {};
  bag.forEach((disc) => {
    typeCounts[disc.type ?? 'Unknown'] =
      (typeCounts[disc.type ?? 'Unknown'] || 0) + 1;
  });

  const missing = types.filter((t) => !typeCounts[t]);
  const overrepresented = Object.keys(typeCounts).filter(
    (t) => typeCounts[t] >= 4
  );
  const speeds = bag.map((d) => d.flight?.speed ?? 0).filter(Boolean);
  const avgSpeed = speeds.length
    ? (speeds.reduce((a, b) => a + b, 0) / speeds.length).toFixed(1)
    : null;

  const suggestions: string[] = [];
  for (const m of missing) {
    if (m === 'Putter')
      suggestions.push('Try adding a stable putter like a Luna, Judge, or P2.');
    if (m === 'Midrange')
      suggestions.push('Consider a versatile midrange like a Buzzz, Mako3, or Truth.');
    if (m === 'Fairway Driver')
      suggestions.push('Add a control driver such as a Teebird, Escape, or Crave.');
    if (m === 'Distance Driver')
      suggestions.push('Try a longer driver like a Wraith, Destroyer, or Trespass.');
  }

  if (avgSpeed && parseFloat(avgSpeed) > 9)
    suggestions.push(
      'Your average speed is high - consider adding a slower disc for control shots.'
    );
  if (avgSpeed && parseFloat(avgSpeed) < 6)
    suggestions.push(
      'Your bag leans slow - consider adding a faster driver for extra distance.'
    );

  return { missing, overrepresented, avgSpeed, suggestions };
}

export default function BagAnalyzer({ bag }: { bag: Disc[] }) {
  const [open, setOpen] = useState(true);
  const { missing, overrepresented, avgSpeed, suggestions } = analyzeBagGaps(bag);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-[var(--surface)]/60 border border-[var(--muted)]/40 rounded-xl p-5 shadow-sm mt-4"
    >
      <button
        className="flex items-center justify-between w-full text-left font-semibold text-[var(--muted-foreground)]"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-[var(--primary)]" />
          Bag Analysis
        </span>
        {open ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="mt-3"
        >
          <ul className="text-sm text-[var(--muted-foreground)] space-y-1">
            {missing.length > 0 ? (
              <li>🧩 Missing: {missing.join(', ')}</li>
            ) : (
              <li>✅ You have a balanced mix of disc types.</li>
            )}
            {overrepresented.length > 0 && (
              <li>⚖️ Overrepresented: {overrepresented.join(', ')}</li>
            )}
            {avgSpeed && <li>💨 Avg. Speed: {avgSpeed}</li>}
          </ul>

          {suggestions.length > 0 && (
            <div className="mt-3 border-t border-[var(--muted)]/30 pt-3">
              <p className="font-medium text-[var(--primary)] mb-1">Suggestions:</p>
              <ul className="list-disc ml-5 text-sm text-[var(--muted-foreground)] space-y-1">
                {suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
