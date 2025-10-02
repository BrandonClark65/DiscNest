'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

type Disc = {
  _id: string;
  name: string;
  flight: { speed: number; glide: number; turn: number; fade: number };
  image: string;
};

export default function DiscBagDisplay() {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const email = session?.user?.email;
  const [bagDiscs, setBagDiscs] = useState<Disc[]>([]);

  const pocketPositions = [
    { top: '30%', left: '20%' },
    { top: '30%', left: '40%' },
    { top: '30%', left: '60%' },
    { top: '60%', left: '25%' },
    { top: '60%', left: '45%' },
    { top: '60%', left: '65%' },
  ];

  useEffect(() => {
    if (!isLoggedIn || !email) return;

    const fetchBagDiscs = async () => {
      try {
        const res = await fetch(`/api/user/discs/bag?email=${email}`);

        if (!res.ok) {
          const text = await res.text(); // capture error body
          throw new Error(`Fetch failed: ${res.status} ${res.statusText} — ${text}`);
        }

        const data = await res.json();
        setBagDiscs(data.bag || []);
      } catch (err) {
        console.error('❌ Error fetching bag discs:', err);
      }
    };

    fetchBagDiscs();
  }, [isLoggedIn, email]);

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <img src="/images/disc-bag.png" alt="Disc Golf Bag" className="w-full" />

      {isLoggedIn ? (
        bagDiscs.map((disc, i) => (
          <div
            key={disc._id}
            className="absolute"
            style={{
              top: pocketPositions[i % pocketPositions.length].top,
              left: pocketPositions[i % pocketPositions.length].left,
            }}
            data-tooltip-id={`disc-${disc._id}`}
            data-tooltip-content={`${disc.name} • Speed: ${disc.flight.speed}, Glide: ${disc.flight.glide}, Turn: ${disc.flight.turn}, Fade: ${disc.flight.fade}`}
          >
            <img
              src={disc.image}
              alt={disc.name}
              className="w-12 h-12 rounded-full hover:scale-105 transition"
            />
            <Tooltip id={`disc-${disc._id}`} place="top" />
          </div>
        ))
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-xl text-gray-500 bg-white bg-opacity-80 p-4 rounded shadow">
            Log in to fill your bag!
          </p>
        </div>
      )}
    </div>
  );
}