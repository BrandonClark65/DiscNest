'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import type { Disc } from '../types/disc';

export default function DiscBagDisplay() {
  const { data: session } = useSession();
  const email = session?.user?.email;
  const isLoggedIn = !!email;
  const [bagDiscs, setBagDiscs] = useState<Disc[]>([]);
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchBagDiscs = async () => {
      const res = await fetch(`/api/user/discs/bag?email=${email}`);
      const data = await res.json();
      setBagDiscs(data.bag || []);
      setVisibleCount(0);
    };
    fetchBagDiscs();
  }, [isLoggedIn, email]);

  // Fade-in animation
  useEffect(() => {
    if (bagDiscs.length === 0) return;

    let i = 0;
    const interval = setInterval(() => {
      i++;
      setVisibleCount(i);
      if (i >= bagDiscs.length) clearInterval(interval);
    }, 250);

    return () => clearInterval(interval);
  }, [bagDiscs]);

  const DISC_SIZE = 150;
  const DISC_OVERLAP = 0.9;
  const MAX_DISCS = 9;
  const START_LEFT = 75;
  const START_TOP = 300;

  return (
    <div className="flex justify-center items-center w-full">
      <div className="relative">
        {/* Background square */}
        <img
          src="/images/square-xxl.png"
          alt="Background"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 w-[400px] h-[400px]"
        />

        {/* Message when not logged in */}
        {!isLoggedIn && (
          <div
            className="absolute text-gray-600 text-lg font-medium text-center"
            style={{
              top: START_TOP - 40,
              left: START_LEFT + 30,
              width: 300,
            }}
          >
            Log in to fill your bag!
          </div>
        )}

        {/* Discs (only show when logged in) */}
        {isLoggedIn &&
          bagDiscs.slice(0, MAX_DISCS).map((disc, i) => {
            if (i >= visibleCount) return null;
            return (
              <div
                key={disc._id}
                className="absolute transition-opacity duration-700 opacity-100"
                style={{
                  top: START_TOP,
                  left: START_LEFT + i * DISC_SIZE * (1 - DISC_OVERLAP),
                  width: DISC_SIZE,
                  height: DISC_SIZE,
                  zIndex: i,
                }}
              >
                <div className="relative w-full h-full cursor-pointer group">
                  <svg
                    viewBox="0 0 1200 1800"
                    width={DISC_SIZE}
                    height={DISC_SIZE}
                    className="transition-transform duration-300 group-hover:scale-110"
                    style={{
                      filter: "drop-shadow(0px 0px 8px rgba(0, 0, 0, 0.5))",

                    }}
                  >
                    {/* Removed the outer stroke group that caused outlines */}
                    <path
                      fill={disc.color}
                      d="M598.5 1791 c-5.5 -0.4 -19.2 -0.8 -30.5 -0.9 -19.5 -0.1 -29.5 -1.1 -43.5 -4.3 -4 -0.9 -15.2 -5.2 -16.3 -6.2 -0.1 -0.2 -0.9 -3.5 -1.7 -7.4 -1.2 -5.7 -1.7 -24.6 -2.5 -97.4 -1.2 -102.9 -1.4 -664.3 -0.5 -1062.8 l0.7 -268.5 2.3 -13 c1.6 -8.8 2.2 -14.1 1.6 -16.5 -0.5 -2.2 -0.3 -5 0.5 -7.5 0.7 -2.2 1.8 -7.1 2.5 -11 0.6 -3.8 1.5 -7.7 2 -8.6 0.4 -0.9 1.3 -4.7 1.9 -8.5 0.7 -4.3 2.9 -10.8 6 -17.4 2.6 -5.8 5.7 -13.2 6.8 -16.5 1.1 -3.3 2.9 -8 4 -10.5 1.2 -2.5 2.7 -7.5 3.5 -11 0.8 -3.6 3.1 -10.3 5.1 -15 2 -4.7 5 -12.5 6.7 -17.3 1.6 -4.8 4.3 -11.7 5.9 -15.2 1.6 -3.6 4.3 -11.5 6 -17.7 1.8 -6.2 4.7 -16.5 6.6 -22.8 1.9 -6.3 4.6 -17.3 6 -24.5 4.9 -25.6 8.7 -41.5 9.9 -41.5 0.7 0 1.6 -3.7 2.4 -9.2 1.6 -11.6 5.5 -26.7 8.2 -31.9 2.9 -5.9 8.1 -11.1 13.6 -13.9 11.5 -5.9 32.3 -0.8 44 11 3 2.9 10.5 15.5 14.5 24.3 1 2.1 2.7 5.1 3.8 6.7 1.1 1.5 2 3.6 2 4.5 0 1 2 6.4 4.5 12.1 2.5 5.6 4.5 11 4.5 11.8 0 0.8 1.6 4.5 3.6 8.3 5.7 10.8 10.1 29.7 13.3 57.8 2.7 22.7 3.1 70.5 3.1 365.5 0 565.7 -2.9 1099.7 -6.9 1230.7 l-0.8 27.2 -2.6 3.5 c-6.7 8.8 -25.5 12.8 -64.2 13.9 -8.8 0.2 -20.5 0.1 -26 -0.3z"
                    />
                  </svg>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300">
                    {disc.name}
                  </div>
                </div>
              </div>
            );
          })}

        {/* Bag image always visible */}
        <img
          src="/images/bag-no-discs.png"
          alt="Disc Golf Bag"
          className="relative z-10 w-[500px] h-[500px]"
        />
      </div>
    </div>
  );
}








