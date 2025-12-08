'use client';

import { useSession, getSession } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';
import type { Disc } from '../types/disc';

type DiscBagDisplayProps = {
  bag?: Disc[]; // optional controlled bag
};

export default function DiscBagDisplay({ bag }: DiscBagDisplayProps) {
  const { data: session } = useSession();
  const sessionEmail = session?.user?.email;

  const [bagDiscs, setBagDiscs] = useState<Disc[]>(bag || []);
  const [visibleCount, setVisibleCount] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const isLoggedIn = !!sessionEmail;

  // If a controlled bag prop is passed, mirror it to local state
  useEffect(() => {
    if (bag) {
      setBagDiscs(bag);
      setVisibleCount(0);
    }
  }, [bag]);

  // Fetch bag when session becomes available (or fallback to getSession)
  useEffect(() => {
    if (bag) return; // controlled prop takes precedence

    let cancelled = false;
    const fetchIfReady = async () => {
      const s = session ?? (await getSession());
      const email = s?.user?.email;
      if (!email) {
        return;
      }

      try {
        const res = await fetch(`/api/user/discs/bag?email=${encodeURIComponent(email)}`);
        if (!res.ok) {
          console.error('[DiscBagDisplay] fetch returned not ok', res.status);
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setBagDiscs(data.bag || []);
          setVisibleCount(0);
        }
      } catch (err) {
        if (!cancelled) console.error('❌ Failed to fetch bag discs:', err);
      }
    };

    fetchIfReady();
    return () => {
      cancelled = true;
    };
  }, [session, bag]);

  // Animate discs when bagDiscs changes (independent of bag image)
  useEffect(() => {
    if (!bagDiscs || bagDiscs.length === 0) {
      setVisibleCount(0);
      return;
    }

    let i = 0;
    setVisibleCount(0);

    const interval = setInterval(() => {
      i++;
      setVisibleCount(i);
      if (i >= bagDiscs.length) clearInterval(interval);
    }, 250);

    return () => clearInterval(interval);
  }, [bagDiscs]);

  // --- Layout constants (keep original px logic) ---
  const BASE_W = 500;
  const BASE_H = 500;
  const DISC_SIZE = 150;
  const DISC_HEIGHT = 150;
  const DISC_WIDTH = 19;
  const DISC_OVERLAP = 0.3;
  const MAX_DISCS = 16;
  const START_LEFT = 140;
  const START_TOP = 300;
  const CONTAINER_WIDTH = BASE_W;
  const CONTAINER_HEIGHT = BASE_H;

  // ✅ Responsive scaler: scale the whole 500x500 canvas to the container width
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!wrapperRef.current) return;
    const el = wrapperRef.current;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        // keep square container; scale based on width vs BASE_W
        const s = width / BASE_W;
        setScale(s);
      }
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="flex justify-center items-center w-full px-4">
      {/* ✅ Outer responsive square box */}
      <div
        ref={wrapperRef}
        className="
          relative
          w-full
          max-w-[700px]
          aspect-square
          sm:max-w-[450px]
          md:max-w-[550px]
          lg:max-w-[650px]
          xl:max-w-[700px]
        "
      >
        {/* ✅ Fixed-size canvas that we scale uniformly */}
        <div
          className="absolute top-0 left-0"
          style={{
            width: BASE_W,
            height: BASE_H,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          {/* Background square (keep your original sizing/positioning) */}
          <img
            src="/images/square-xxl.png"
            alt="Background"
            className="absolute z-0"
            style={{
              width: 250,
              height: 300,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />

          {/* Login message */}
          {session === undefined ? null : !isLoggedIn ? (
            <div
              className="absolute text-gray-600 text-lg font-medium text-center z-20"
              style={{ top: START_TOP + 10, left: START_LEFT - 40, width: 300 }}
            >
              Log in to fill your bag!
            </div>
          ) : null}

          {/* Main disc stack */}
          <div className="relative" style={{ width: CONTAINER_WIDTH, height: CONTAINER_HEIGHT }}>
            {isLoggedIn && (
              <div className={`transition-opacity duration-700 ${bagDiscs.length ? 'opacity-100' : 'opacity-0'}`}>
                {bagDiscs.slice(0, MAX_DISCS).map((disc, i) => {
                  if (i >= visibleCount) return null;
                  const isHovered = hoveredIndex === i;
                  const discLeft = START_LEFT + i * DISC_WIDTH * (1 - DISC_OVERLAP);
                  const discTop = START_TOP;

                  return (
                    <div
                      key={disc._id ?? `${disc.name}-${i}`}
                      className="absolute flex justify-center items-center z-10 transition-all duration-300"
                      style={{
                        top: discTop,
                        left: discLeft,
                        width: DISC_WIDTH,
                        height: DISC_HEIGHT,
                        transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                        overflow: 'visible', // ✅ ensure SVG isn’t clipped
                      }}
                      onMouseEnter={() => setHoveredIndex(i)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      {/* Keep your SVG exactly as before */}
                      <svg
                        viewBox="0 0 1200 1800"
                        width={DISC_SIZE}
                        height={DISC_SIZE}
                        className="drop-shadow-md pointer-events-none"
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          transition: 'transform 0.3s',
                        }}
                      >
                        {/* defs + paths (unchanged) */}
                        <defs>
                          <radialGradient id={`disc-highlight-${disc._id ?? i}`} cx="30%" cy="30%" r="70%">
                            <stop offset="0%" stopColor="white" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="white" stopOpacity="0" />
                          </radialGradient>
                          <radialGradient id={`disc-shadow-${disc._id ?? i}`} cx="75%" cy="75%" r="70%">
                            <stop offset="0%" stopColor="black" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="black" stopOpacity="0" />
                          </radialGradient>
                        </defs>

                        {/* ⚠️ keep your original path data exactly */}
                        <path
                          fill={disc.color}
                          d="M598.5 1791 c-5.5 -0.4 -19.2 -0.8 -30.5 -0.9 -19.5 -0.1 -29.5 -1.1 -43.5 -4.3 -4 -0.9 -15.2 -5.2 -16.3 -6.2 -0.1 -0.2 -0.9 -3.5 -1.7 -7.4 -1.2 -5.7 -1.7 -24.6 -2.5 -97.4 -1.2 -102.9 -1.4 -664.3 -0.5 -1062.8 l0.7 -268.5 2.3 -13 c1.6 -8.8 2.2 -14.1 1.6 -16.5 -0.5 -2.2 -0.3 -5 0.5 -7.5 0.7 -2.2 1.8 -7.1 2.5 -11 0.6 -3.8 1.5 -7.7 2 -8.6 0.4 -0.9 1.3 -4.7 1.9 -8.5 0.7 -4.3 2.9 -10.8 6 -17.4 2.6 -5.8 5.7 -13.2 6.8 -16.5 1.1 -3.3 2.9 -8 4 -10.5 1.2 -2.5 2.7 -7.5 3.5 -11 0.8 -3.6 3.1 -10.3 5.1 -15 2 -4.7 5 -12.5 6.7 -17.3 1.6 -4.8 4.3 -11.7 5.9 -15.2 1.6 -3.6 4.3 -11.5 6 -17.7 1.8 -6.2 4.7 -16.5 6.6 -22.8 1.9 -6.3 4.6 -17.3 6 -24.5 4.9 -25.6 8.7 -41.5 9.9 -41.5 0.7 0 1.6 -3.7 2.4 -9.2 1.6 -11.6 5.5 -26.7 8.2 -31.9 2.9 -5.9 8.1 -11.1 13.6 -13.9 11.5 -5.9 32.3 -0.8 44 11 3 2.9 10.5 15.5 14.5 24.3 1 2.1 2.7 5.1 3.8 6.7 1.1 1.5 2 3.6 2 4.5 0 1 2 6.4 4.5 12.1 2.5 5.6 4.5 11 4.5 11.8 0 0.8 1.6 4.5 3.6 8.3 5.7 10.8 10.1 29.7 13.3 57.8 2.7 22.7 3.1 70.5 3.1 365.5 0 565.7 -2.9 1099.7 -6.9 1230.7 l-0.8 27.2 -2.6 3.5 c-6.7 8.8 -25.5 12.8 -64.2 13.9 -8.8 0.2 -20.5 0.1 -26 -0.3z"
                        />
                        <path
                          fill={`url(#disc-highlight-${disc._id ?? i})`}
                          d="M598.5 1791 c-5.5 -0.4 -19.2 -0.8 -30.5 -0.9 -19.5 -0.1 -29.5 -1.1 -43.5 -4.3 -4 -0.9 -15.2 -5.2 -16.3 -6.2 -0.1 -0.2 -0.9 -3.5 -1.7 -7.4 -1.2 -5.7 -1.7 -24.6 -2.5 -97.4 -1.2 -102.9 -1.4 -664.3 -0.5 -1062.8 l0.7 -268.5 2.3 -13 c1.6 -8.8 2.2 -14.1 1.6 -16.5 -0.5 -2.2 -0.3 -5 0.5 -7.5 0.7 -2.2 1.8 -7.1 2.5 -11 0.6 -3.8 1.5 -7.7 2 -8.6 0.4 -0.9 1.3 -4.7 1.9 -8.5 0.7 -4.3 2.9 -10.8 6 -17.4 2.6 -5.8 5.7 -13.2 6.8 -16.5 1.1 -3.3 2.9 -8 4 -10.5 1.2 -2.5 2.7 -7.5 3.5 -11 0.8 -3.6 3.1 -10.3 5.1 -15 2 -4.7 5 -12.5 6.7 -17.3 1.6 -4.8 4.3 -11.7 5.9 -15.2 1.6 -3.6 4.3 -11.5 6 -17.7 1.8 -6.2 4.7 -16.5 6.6 -22.8 1.9 -6.3 4.6 -17.3 6 -24.5 4.9 -25.6 8.7 -41.5 9.9 -41.5 0.7 0 1.6 -3.7 2.4 -9.2 1.6 -11.6 5.5 -26.7 8.2 -31.9 2.9 -5.9 8.1 -11.1 13.6 -13.9 11.5 -5.9 32.3 -0.8 44 11 3 2.9 10.5 15.5 14.5 24.3 1 2.1 2.7 5.1 3.8 6.7 1.1 1.5 2 3.6 2 4.5 0 1 2 6.4 4.5 12.1 2.5 5.6 4.5 11 4.5 11.8 0 0.8 1.6 4.5 3.6 8.3 5.7 10.8 10.1 29.7 13.3 57.8 2.7 22.7 3.1 70.5 3.1 365.5 0 565.7 -2.9 1099.7 -6.9 1230.7 l-0.8 27.2 -2.6 3.5 c-6.7 8.8 -25.5 12.8 -64.2 13.9 -8.8 0.2 -20.5 0.1 -26 -0.3z"
                        />
                        <path
                          fill={`url(#disc-shadow-${disc._id ?? i})`}
                          d="M598.5 1791 c-5.5 -0.4 -19.2 -0.8 -30.5 -0.9 -19.5 -0.1 -29.5 -1.1 -43.5 -4.3 -4 -0.9 -15.2 -5.2 -16.3 -6.2 -0.1 -0.2 -0.9 -3.5 -1.7 -7.4 -1.2 -5.7 -1.7 -24.6 -2.5 -97.4 -1.2 -102.9 -1.4 -664.3 -0.5 -1062.8 l0.7 -268.5 2.3 -13 c1.6 -8.8 2.2 -14.1 1.6 -16.5 -0.5 -2.2 -0.3 -5 0.5 -7.5 0.7 -2.2 1.8 -7.1 2.5 -11 0.6 -3.8 1.5 -7.7 2 -8.6 0.4 -0.9 1.3 -4.7 1.9 -8.5 0.7 -4.3 2.9 -10.8 6 -17.4 2.6 -5.8 5.7 -13.2 6.8 -16.5 1.1 -3.3 2.9 -8 4 -10.5 1.2 -2.5 2.7 -7.5 3.5 -11 0.8 -3.6 3.1 -10.3 5.1 -15 2 -4.7 5 -12.5 6.7 -17.3 1.6 -4.8 4.3 -11.7 5.9 -15.2 1.6 -3.6 4.3 -11.5 6 -17.7 1.8 -6.2 4.7 -16.5 6.6 -22.8 1.9 -6.3 4.6 -17.3 6 -24.5 4.9 -25.6 8.7 -41.5 9.9 -41.5 0.7 0 1.6 -3.7 2.4 -9.2 1.6 -11.6 5.5 -26.7 8.2 -31.9 2.9 -5.9 8.1 -11.1 13.6 -13.9 11.5 -5.9 32.3 -0.8 44 11 3 2.9 10.5 15.5 14.5 24.3 1 2.1 2.7 5.1 3.8 6.7 1.1 1.5 2 3.6 2 4.5 0 1 2 6.4 4.5 12.1 2.5 5.6 4.5 11 4.5 11.8 0 0.8 1.6 4.5 3.6 8.3 5.7 10.8 10.1 29.7 13.3 57.8 2.7 22.7 3.1 70.5 3.1 365.5 0 565.7 -2.9 1099.7 -6.9 1230.7 l-0.8 27.2 -2.6 3.5 c-6.7 8.8 -25.5 12.8 -64.2 13.9 -8.8 0.2 -20.5 0.1 -26 -0.3z"
                        />
                      </svg>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tooltip */}
            {bagDiscs.length > 0 &&
              bagDiscs.slice(0, MAX_DISCS).map((disc, i) => {
                if (i >= visibleCount || hoveredIndex !== i) return null;
                const discLeft = START_LEFT + i * DISC_WIDTH * (1 - DISC_OVERLAP);
                const discTop = START_TOP;
                return (
                  <div
                    key={`tooltip-${disc._id ?? i}`}
                    className="absolute z-50 px-2 py-1 bg-black text-white text-xs rounded"
                    style={{
                      top: discTop - 25,
                      left: discLeft + DISC_WIDTH / 2,
                      transform: 'translateX(-50%)',
                    }}
                  >
                    {disc.name}
                  </div>
                );
              })}

            {/* Bag overlay image */}
            <img
              src="/images/bag-no-discs.png"
              alt="Disc Golf Bag"
              className="absolute top-0 left-0 z-20 w-full h-full pointer-events-none"
              onLoad={() => {
                setBagLoaded(true);
              }}
              style={{
                filter: 'drop-shadow(0 8px 12px rgba(0, 0, 0, 0.4))',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
