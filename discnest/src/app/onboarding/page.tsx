'use client';

import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const router = useRouter();

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-center text-green-700">Welcome to DiscNest 🥏</h1>
      <p className="text-center text-gray-600">
        You’re officially in. Let’s get your gear organized and your profile ready to roll.
      </p>

      <div className="grid gap-4">
        <button
          onClick={() => router.push('/shelf')}
          className="w-full bg-green-600 text-white py-3 rounded hover:bg-green-700"
        >
          Set Up Your Disc Shelf
        </button>
        <button
          onClick={() => router.push('/bag')}
          className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700"
        >
          Build Your Bag
        </button>
        <button
          onClick={() => router.push('/marketplace')}
          className="w-full bg-yellow-500 text-white py-3 rounded hover:bg-yellow-600"
        >
          Browse Marketplace
        </button>
      </div>

      <div className="mt-6 text-center text-sm text-gray-500">
        You can always revisit this setup later from your profile.
      </div>
    </div>
  );
}