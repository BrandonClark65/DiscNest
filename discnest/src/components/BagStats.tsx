'use client';

import { useState, useEffect, useRef } from 'react';
import { BarChart3 } from 'lucide-react';
import type { Disc } from '@/types/disc';

type BagStatsPopoverProps = {
  bag: Disc[];
};

export default function BagStats({ bag }: BagStatsPopoverProps) {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

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

  const byType = bag.reduce<Record<string, number>>((acc, d) => {
    if (!d.type) return acc;
    acc[d.type] = (acc[d.type] || 0) + 1;
    return acc;
  }, {});

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

  // Average flight
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

  // Average wear
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

  // Weight stats
  const weights = bag.map((d) => d.weight).filter(Boolean) as number[];
  const avgWeight =
    weights.length > 0
      ? (weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(1)
      : null;
  const minWeight = weights.length > 0 ? Math.min(...weights) : null;
  const maxWeight = weights.length > 0 ? Math.max(...weights) : null;

  // Most used brand
  const topBrand =
    Object.entries(byBrand).sort((a, b) => b[1] - a[1])[0] || null;

  // Bag completeness
  const hasType = (type: string) =>
    bag.some((d) => d.type?.toLowerCase().includes(type.toLowerCase()));
  const completeness = ['Putter', 'Midrange', 'Fairway', 'Distance'].filter((t) =>
    hasType(t)
  ).length;

  return (
    <div className="relative inline-block text-left" ref={popoverRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="p-2 rounded-full bg-green-100 hover:bg-green-200 transition-colors shadow-sm"
        title="View Bag Stats"
      >
        <BarChart3 className="w-6 h-6 text-green-700" />
      </button>

      {open && (
        <>
          {/* Overlay for mobile */}
          <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" />

          {/* Popover panel */}
          <div
            className={`
              absolute z-50 right-0 mt-2 w-72 rounded-xl bg-white shadow-xl border border-gray-200 p-4
              transform transition-all duration-200
              ${open ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
              lg:absolute lg:right-0 lg:top-full lg:translate-y-2
            `}
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-green-700">Bag Stats</h3>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {total === 0 ? (
              <p className="text-sm text-gray-500 italic">No discs in bag</p>
            ) : (
              <div className="space-y-3 text-sm text-gray-700">
                <p><b>Total Discs:</b> {total}</p>
                <p><b>Unique Molds:</b> {uniqueMolds}</p>

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
                    <b>Avg Weight:</b> {avgWeight} g
                    {minWeight && maxWeight && (
                      <span className="text-gray-500"> ({minWeight}–{maxWeight}g)</span>
                    )}
                  </p>
                )}

                {topBrand && (
                  <p><b>Top Brand:</b> {topBrand[0]} ({topBrand[1]})</p>
                )}

                <p><b>Bag Completeness:</b> {completeness}/4</p>

                {Object.keys(byPlastic).length > 0 && (
                  <div>
                    <p><b>Plastics:</b></p>
                    <ul className="ml-3 list-disc text-gray-600">
                      {Object.entries(byPlastic)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 3)
                        .map(([plastic, count]) => (
                          <li key={plastic}>{plastic}: {count}</li>
                        ))}
                    </ul>
                  </div>
                )}

                {Object.keys(byStability).length > 0 && (
                  <div>
                    <p><b>Stability:</b></p>
                    <ul className="ml-3 list-disc text-gray-600">
                      {Object.entries(byStability).map(([stab, count]) => (
                        <li key={stab}>{stab}: {count}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {avgFlight && (
                  <div>
                    <p><b>Avg Flight:</b></p>
                    <div className="ml-3 text-gray-600 grid grid-cols-2 gap-x-3">
                      <p><b>Speed:</b> {avgFlight.speed}</p>
                      <p><b>Glide:</b> {avgFlight.glide}</p>
                      <p><b>Turn:</b> {avgFlight.turn}</p>
                      <p><b>Fade:</b> {avgFlight.fade}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
