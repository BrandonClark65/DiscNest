'use client';

import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

type Disc = {
  _id: string;
  name: string;
  color: string;
};

export default function DiscBagDisplay() {
  const { data: session } = useSession();
  const email = session?.user?.email;
  const isLoggedIn = !!email;
  const [bagDiscs, setBagDiscs] = useState<Disc[]>([]);

  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchBagDiscs = async () => {
      const res = await fetch(`/api/user/discs/bag?email=${email}`);
      const data = await res.json();
      setBagDiscs(data.bag || []);
    };
    fetchBagDiscs();
  }, [isLoggedIn, email]);

  {/* Configurable constants */}
  const DISC_SIZE = 200;       // much smaller so they fit in the 500px bag
  const DISC_OFFSET = 5;     // distance between discs
  const MAX_DISCS = 9;        // maximum discs shown

  return (
    <div className="flex justify-center items-center w-full">
      <div className="relative">
        {/* Background square */}
        <Image
          src="/images/square-xxl.png"
          alt="Background"
          width={400}
          height={400}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0"
        />

        {/* Render discs */}
        {bagDiscs.slice(0, MAX_DISCS).map((disc, i) => (
          <div
            key={disc._id}
            className="absolute z-5"
            style={{
              top: "55%", // tweak to sit correctly in the bag
              left: `${140 + i * DISC_OFFSET}px`, // starting point + offset
              transform: "translateY(-50%)",
            }}
          >
            <Image
              src="/images/solo-disc.png"
              alt={disc.name}
              width={DISC_SIZE}
              height={DISC_SIZE}
              className="rounded-full"
            />
          </div>
        ))}

        {/* Bag image */}
        <Image
          src="/images/bag-no-discs.png"
          alt="Disc Golf Bag"
          width={500}
          height={500}
          className="relative z-10"
        />
      </div>
    </div>
  );
}




