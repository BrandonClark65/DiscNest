'use client';

import { useSession } from 'next-auth/react';

export default function ProfilePage() {
  const { data: session, status } = useSession();

  if (status === 'loading') return <p>Loading...</p>;
  if (!session?.user) return <p>Please log in to view your profile.</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Welcome, {session.user.name}</h1>

      <div className="flex items-center gap-4">
        {session.user.image && (
          <img
            src={session.user.image}
            alt="Profile"
            className="w-20 h-20 rounded-full border"
          />
        )}
        <div>
          <p className="text-sm text-gray-600">Email: {session.user.email}</p>
          <p className="text-sm text-gray-600">Role: {session.user.role || 'player'}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow-sm border">
        <h2 className="text-lg font-semibold mb-2">Disc Preferences</h2>
        <ul className="space-y-1 text-sm text-gray-700">
          <li><strong>Favorite Brands:</strong> Innova, Discraft</li>
          <li><strong>Preferred Types:</strong> Driver, Midrange</li>
          <li><strong>Stability Preference:</strong> Slightly Overstable</li>
        </ul>
      </div>

      <div className="bg-white p-4 rounded shadow-sm border">
        <h2 className="text-lg font-semibold mb-2">Play Style</h2>
        <ul className="space-y-1 text-sm text-gray-700">
          <li><strong>Throwing Style:</strong> Backhand dominant</li>
          <li><strong>Max Distance:</strong> ~375 ft</li>
          <li><strong>Favorite Course:</strong> Pier Park, Portland OR</li>
        </ul>
      </div>
    </div>
  );
}