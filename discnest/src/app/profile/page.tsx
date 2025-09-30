'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/profile')
        .then(res => res.json())
        .then(data => {
          console.log('📥 Loaded profile:', data.user);
          setProfile(data.user);
        });
    }
  }, [status]);


  const handleSave = async () => {
    setLoading(true);
    await fetch('/api/profile', {
      method: 'POST',
      body: JSON.stringify(profile),
      headers: { 'Content-Type': 'application/json' },
    });
    setLoading(false);
  };

  if (status === 'loading' || !profile) return <p>Loading...</p>;
  if (!session?.user) return <p>Please log in to view your profile.</p>;

  const profileCompleted = [
    profile.favoriteBrands?.length,
    profile.preferredTypes?.length,
    profile.stability,
    profile.throwingStyle,
    profile.maxDistance,
    profile.favoriteCourse,
  ].every(Boolean);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Welcome, {profile.name}</h1>

      {/* <div className="flex items-center gap-4">
        {profile.image && (
          <img src={profile.image} alt="Profile" className="w-20 h-20 rounded-full border" />
        )}
        <input
          type="text"
          value={profile.image || ''}
          onChange={e => setProfile({ ...profile, image: e.target.value })}
          placeholder="Profile Image URL"
          className="border px-3 py-2 rounded w-full"
        />
      </div> */}

      <div className="bg-white p-4 rounded shadow-sm border space-y-2">
        <h2 className="text-lg font-semibold">Disc Preferences</h2>
        <input
          type="text"
          value={profile.favoriteBrands?.join(', ') || ''}
          onChange={e => setProfile({ ...profile, favoriteBrands: e.target.value.split(',').map(b => b.trim()) })}
          placeholder="Owned Brands (comma-separated)"
          className="border px-3 py-2 rounded w-full"
        />
        <input
          type="text"
          value={profile.preferredTypes?.join(', ') || ''}
          onChange={e => setProfile({ ...profile, preferredTypes: e.target.value.split(',').map(t => t.trim()) })}
          placeholder="Preferred Types (comma-separated)"
          className="border px-3 py-2 rounded w-full"
        />
        <input
          type="text"
          value={profile.stability || ''}
          onChange={e => setProfile({ ...profile, stability: e.target.value })}
          placeholder="Stability Preference"
          className="border px-3 py-2 rounded w-full"
        />
      </div>

      <div className="bg-white p-4 rounded shadow-sm border space-y-2">
        <h2 className="text-lg font-semibold">Play Style</h2>
        <input
          type="text"
          value={profile.throwingStyle || ''}
          onChange={e => setProfile({ ...profile, throwingStyle: e.target.value })}
          placeholder="Throwing Style"
          className="border px-3 py-2 rounded w-full"
        />
        <input
          type="number"
          value={profile.maxDistance || ''}
          onChange={e => setProfile({ ...profile, maxDistance: Number(e.target.value) })}
          placeholder="Max Distance (ft)"
          className="border px-3 py-2 rounded w-full"
        />
        <input
          type="text"
          value={profile.favoriteCourse || ''}
          onChange={e => setProfile({ ...profile, favoriteCourse: e.target.value })}
          placeholder="Favorite Course"
          className="border px-3 py-2 rounded w-full"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {loading ? 'Saving...' : 'Save Profile'}
      </button>

      <div className="mt-6 space-y-4">
        <h3 className="text-lg font-semibold">Milestones</h3>

        <div className="flex flex-wrap gap-4">
          {profile.discCount >= 1 && <Badge label="🎯 First Disc Added" />}
          {profile.discCount >= 100 && <Badge label="💯 100+ Discs" />}
          {profileCompleted && <Badge label="🧠 Profile Completed" />}
          {profile.maxDistance >= 400 && <Badge label="🚀 Big Arm" />}
          {profile.favoriteBrands?.length >= 5 && <Badge label="🧢 Brand Collector" />}
        </div>

        <div className="space-y-2 mt-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Discs Added: {profile.discCount} / 100</p>
            <ProgressBar value={profile.discCount} max={100} />
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Owned Brands: {profile.favoriteBrands?.length || 0} / 5</p>
            <ProgressBar value={profile.favoriteBrands?.length || 0} max={5} />
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Max Distance: {profile.maxDistance} ft / 400 ft</p>
            <ProgressBar value={profile.maxDistance} max={400} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm font-medium shadow-sm">
      <span className="text-lg">{label}</span>
    </div>
  );
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const percent = Math.min((value / max) * 100, 100);
  return (
    <div className="w-full bg-gray-200 rounded-full h-3">
      <div
        className="bg-green-500 h-3 rounded-full"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}