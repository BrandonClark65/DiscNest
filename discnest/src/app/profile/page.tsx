'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { DiscNestUser } from '@/types/user';
import { DiscBrands, DiscPlastics } from '@/app/constants/discData';
import clsx from 'clsx';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<DiscNestUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'disc' | 'play'>('basic');

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/profile')
        .then(res => res.json())
        .then(data => setProfile(data.user));
    }
  }, [status]);

  if (status === 'loading') return <p className="p-4">Loading...</p>;

  // User not logged in
  if (!session?.user) return <p className="p-4 text-center text-gray-600">Log in to view profile</p>;

  if (!profile) return <p className="p-4">Loading profile...</p>;

  const handleSave = async () => {
    setLoading(true);
    await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    setLoading(false);
  };

  // Calculate profile completion
  const profileFields: (keyof DiscNestUser)[] = [
    'name', 'username', 'bio',
    'pdgaNumber', 'homeCourse', 'goals',
    'dominantHand', 'throwStyle', 'favoriteBrands', 'preferredDiscTypes',
    'stabilityPreference', 'armSpeed', 'skillLevel', 'playFrequency', 'preferredPlastics'
  ];

  const filledFields = profileFields.filter(f => {
    const value = profile[f];
    if (Array.isArray(value)) return value.length > 0;
    return Boolean(value);
  }).length;

  const completionPercent = Math.round((filledFields / profileFields.length) * 100);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Welcome, {profile.name || profile.username}</h1>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className="bg-green-500 h-3 rounded-full transition-all"
          style={{ width: `${completionPercent}%` }}
        />
      </div>
      <p className="text-sm text-gray-600 mt-1">Profile Completion: {completionPercent}%</p>

      {/* Tabs */}
      <div className="flex gap-4 mt-4">
        {['basic', 'disc', 'play'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={clsx(
              'px-4 py-2 rounded-t-lg font-medium',
              activeTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            )}
          >
            {tab === 'basic' ? 'Basic Info' : tab === 'disc' ? 'Disc Golf Info' : 'Play Style'}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="bg-white p-4 rounded-b-lg shadow-sm border space-y-4">
        {activeTab === 'basic' && (
          <>
            <label className="block font-medium">Name</label>
            <input
              type="text"
              value={profile.name || ''}
              onChange={e => setProfile({ ...profile, name: e.target.value })}
              className="border px-3 py-2 rounded w-full"
            />
            <label className="block font-medium">Username</label>
            <input
              type="text"
              value={profile.username || ''}
              onChange={e => setProfile({ ...profile, username: e.target.value })}
              className="border px-3 py-2 rounded w-full"
            />
            <label className="block font-medium">Bio</label>
            <textarea
              value={profile.bio || ''}
              onChange={e => setProfile({ ...profile, bio: e.target.value })}
              className="border px-3 py-2 rounded w-full"
            />
          </>
        )}

        {activeTab === 'disc' && (
          <>
            <label className="block font-medium">PDGA Number</label>
            <input
              type="number"
              value={profile.pdgaNumber || ''}
              onChange={e => setProfile({ ...profile, pdgaNumber: Number(e.target.value) })}
              className="border px-3 py-2 rounded w-full"
            />
            <label className="block font-medium">Home Course</label>
            <input
              type="text"
              value={profile.homeCourse || ''}
              onChange={e => setProfile({ ...profile, homeCourse: e.target.value })}
              className="border px-3 py-2 rounded w-full"
            />
            <label className="block font-medium">Goals</label>
            <input
              type="text"
              value={profile.goals || ''}
              onChange={e => setProfile({ ...profile, goals: e.target.value })}
              className="border px-3 py-2 rounded w-full"
            />
          </>
        )}

        {activeTab === 'play' && (
          <>
            <label className="block font-medium">Dominant Hand</label>
            <select
              value={profile.dominantHand || 'Right'}
              onChange={e => setProfile({ ...profile, dominantHand: e.target.value as DiscNestUser['dominantHand'] })}
              className="border px-3 py-2 rounded w-full"
            >
              <option>Left</option>
              <option>Right</option>
              <option>Both</option>
            </select>

            <label className="block font-medium">Throw Style</label>
            <select
              value={profile.throwStyle || 'Backhand'}
              onChange={e => setProfile({ ...profile, throwStyle: e.target.value as DiscNestUser['throwStyle'] })}
              className="border px-3 py-2 rounded w-full"
            >
              <option>Backhand</option>
              <option>Forehand</option>
              <option>Both</option>
            </select>

            <label className="block font-medium">Favorite Brands</label>
            <select
              multiple
              value={profile.favoriteBrands || []}
              onChange={e => {
                const selected = Array.from(e.target.selectedOptions).map(
                  o => o.value as typeof DiscBrands[number]
                );
                setProfile({ ...profile, favoriteBrands: selected });
              }}
              className="border px-3 py-2 rounded w-full"
            >
              {DiscBrands.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

            <label className="block font-medium">Preferred Disc Types</label>
            <select
              multiple
              value={profile.preferredDiscTypes || []}
              onChange={e => {
                const selected = Array.from(e.target.selectedOptions).map(
                  o => o.value as 'Putter' | 'Midrange' | 'Fairway Driver' | 'Distance Driver'
                );
                setProfile({ ...profile, preferredDiscTypes: selected });
              }}
              className="border px-3 py-2 rounded w-full"
            >
              {['Putter', 'Midrange', 'Fairway Driver', 'Distance Driver'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            <label className="block font-medium">Stability Preference</label>
            <select
              value={profile.stabilityPreference || 'Straight'}
              onChange={e => setProfile({ ...profile, stabilityPreference: e.target.value as DiscNestUser['stabilityPreference'] })}
              className="border px-3 py-2 rounded w-full"
            >
              <option>Straight</option>
              <option>Overstable</option>
              <option>Understable</option>
            </select>

            <label className="block font-medium">Arm Speed</label>
            <select
              value={profile.armSpeed || 'Medium'}
              onChange={e => setProfile({ ...profile, armSpeed: e.target.value as DiscNestUser['armSpeed'] })}
              className="border px-3 py-2 rounded w-full"
            >
              <option>Slow</option>
              <option>Medium</option>
              <option>Fast</option>
            </select>

            <label className="block font-medium">Skill Level</label>
            <select
              value={profile.skillLevel || 'Intermediate'}
              onChange={e => setProfile({ ...profile, skillLevel: e.target.value as DiscNestUser['skillLevel'] })}
              className="border px-3 py-2 rounded w-full"
            >
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
              <option>Pro</option>
            </select>

            <label className="block font-medium">Play Frequency</label>
            <select
              value={profile.playFrequency || '1-2 times per week'}
              onChange={e => setProfile({ ...profile, playFrequency: e.target.value as DiscNestUser['playFrequency'] })}
              className="border px-3 py-2 rounded w-full"
            >
              <option>&lt;1 per week</option>
              <option>1-2 times per week</option>
              <option>Every day</option>
            </select>

            <label className="block font-medium">Preferred Plastics</label>
            <select
              multiple
              value={profile.preferredPlastics || []}
              onChange={e => {
                const selected = Array.from(e.target.selectedOptions).map(
                  o => o.value as typeof DiscPlastics[number]
                );
                setProfile({ ...profile, preferredPlastics: selected });
              }}
              className="border px-3 py-2 rounded w-full"
            >
              {DiscPlastics.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded mt-4"
      >
        {loading ? 'Saving...' : 'Save Profile'}
      </button>
    </div>
  );
}
