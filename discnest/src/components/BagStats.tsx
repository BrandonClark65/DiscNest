'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import type { Disc } from '@/types/disc';

type BagStatsProps = {
  bag: Disc[];
};

export default function BagStats({ bag }: BagStatsProps) {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- BAG ANALYTICS ---
  const total = bag.length;
  const uniqueMolds = new Set(bag.map((d) => d.name)).size;

  const byBrand = bag.reduce<Record<string, number>>((acc, d) => {
    if (!d.brand) return acc;
    acc[d.brand] = (acc[d.brand] || 0) + 1;
    return acc;
  }, {});

  const byPlastic = bag.reduce<Record<string, number>>((acc, d) => {
    if (!d.plastic) return acc;
    acc[d.plastic] = (acc[d.plastic] || 0) + 1;
    return acc;
  }, {});

  const byStability = bag.reduce<Record<string, number>>((acc, d) => {
    if (!d.stability) return acc;
    acc[d.stability] = (acc[d.stability] || 0) + 1;
    return acc;
  }, {});

  const averageFlight = bag.reduce(
    (acc, d) => {
      if (!d.flight) return acc;
      const { speed, glide, turn, fade } = d.flight;
      acc.speed += speed || 0;
      acc.glide += glide || 0;
      acc.turn += turn || 0;
      acc.fade += fade || 0;
      acc.count++;
      return acc;
    },
    { speed: 0, glide: 0, turn: 0, fade: 0, count: 0 }
  );

  const avgFlight =
    averageFlight.count > 0
      ? {
          speed: (averageFlight.speed / averageFlight.count).toFixed(1),
          glide: (averageFlight.glide / averageFlight.count).toFixed(1),
          turn: (averageFlight.turn / averageFlight.count).toFixed(1),
          fade: (averageFlight.fade / averageFlight.count).toFixed(1),
        }
      : null;

  const wearValues = bag
    .map((d) => d.wearLevel)
    .filter((w): w is number => typeof w === 'number');

  const avgWear =
    wearValues.length > 0
      ? wearValues.reduce((a, b) => a + b, 0) / wearValues.length
      : null;

  const wearLabel =
    avgWear === null
      ? null
      : avgWear < 30
      ? 'Mostly new'
      : avgWear < 70
      ? 'Moderately seasoned'
      : 'Well seasoned';

  const weights = bag.map((d) => d.weight).filter(Boolean) as number[];
  const avgWeight =
    weights.length > 0
      ? (weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(1)
      : null;
  const minWeight = weights.length > 0 ? Math.min(...weights) : null;
  const maxWeight = weights.length > 0 ? Math.max(...weights) : null;

  const topBrand =
    Object.entries(byBrand).sort((a, b) => b[1] - a[1])[0] || null;

  const hasType = (type: string) =>
    bag.some((d) => d.type?.toLowerCase().includes(type.toLowerCase()));
  const completeness = ['Putter', 'Midrange', 'Fairway', 'Distance'].filter((t) =>
    hasType(t)
  ).length;

  // Shared stats JSX
  const statsContent = (
    <div className="space-y-3 text-sm text-gray-700">
      <p>
        <b>Total Discs:</b> {total}
      </p>
      <p>
        <b>Unique Molds:</b> {uniqueMolds}
      </p>
      {avgWear !== null && (
        <p>
          <b>Avg Wear:</b> {avgWear.toFixed(0)}%{' '}
          <span
            className={
              avgWear < 30
                ? 'text-green-600'
                : avgWear < 70
                ? 'text-yellow-600'
                : 'text-red-600'
            }
          >
            ({wearLabel})
          </span>
        </p>
      )}
      {avgWeight && (
        <p>
          <b>Avg Weight:</b> {avgWeight}g{' '}
          {minWeight && maxWeight && (
            <span className="text-gray-500">
              ({minWeight}–{maxWeight}g)
            </span>
          )}
        </p>
      )}
      {topBrand && (
        <p>
          <b>Top Brand:</b> {topBrand[0]} ({topBrand[1]})
        </p>
      )}
      <p>
        <b>Bag Completeness:</b> {completeness}/4
      </p>
      {Object.keys(byPlastic).length > 0 && (
        <div>
          <p className="font-medium text-green-700">Plastics:</p>
          <ul className="ml-3 list-disc text-gray-600">
            {Object.entries(byPlastic)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3)
              .map(([plastic, count]) => (
                <li key={plastic}>
                  {plastic}: {count}
                </li>
              ))}
          </ul>
        </div>
      )}
      {Object.keys(byStability).length > 0 && (
        <div>
          <p className="font-medium text-green-700">Stability:</p>
          <ul className="ml-3 list-disc text-gray-600">
            {Object.entries(byStability).map(([stab, count]) => (
              <li key={stab}>
                {stab}: {count}
              </li>
            ))}
          </ul>
        </div>
      )}
      {avgFlight && (
        <div>
          <p className="font-medium text-green-700">Avg Flight:</p>
          <div className="ml-3 text-gray-600 grid grid-cols-2 gap-x-3">
            <p>
              <b>Speed:</b> {avgFlight.speed}
            </p>
            <p>
              <b>Glide:</b> {avgFlight.glide}
            </p>
            <p>
              <b>Turn:</b> {avgFlight.turn}
            </p>
            <p>
              <b>Fade:</b> {avgFlight.fade}
            </p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div ref={popoverRef} className="relative inline-block text-left">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90 text-white shadow-md transition"
        title="View Bag Stats"
      >
        <BarChart3 className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* === Desktop popover === */}
            {!isMobile && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute z-50 right-0 mt-3 w-80 rounded-2xl border border-green-100 bg-white/90 backdrop-blur-xl shadow-2xl p-5"
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-green-700">
                    Bag Stats
                  </h3>
                  <button
                    onClick={() => setOpen(false)}
                    className="text-gray-500 hover:text-red-500 transition"
                  >
                    ✕
                  </button>
                </div>
                {total === 0 ? (
                  <p className="text-sm text-gray-500 italic">
                    No discs in bag
                  </p>
                ) : (
                  statsContent
                )}
              </motion.div>
            )}

            {/* === Mobile bottom sheet === */}
            {isMobile && (
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-white/95 backdrop-blur-xl shadow-2xl border-t border-green-100 p-6 max-h-[75vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-green-700">
                    Bag Stats
                  </h3>
                  <button
                    onClick={() => setOpen(false)}
                    className="text-gray-500 hover:text-red-500 transition"
                  >
                    ✕
                  </button>
                </div>
                {total === 0 ? (
                  <p className="text-sm text-gray-500 italic">
                    No discs in bag
                  </p>
                ) : (
                  statsContent
                )}
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
