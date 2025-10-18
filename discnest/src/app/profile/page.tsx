'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { editableProfileSchema, type UserSchema } from '@/lib/validation/userSchema';
import { DiscBrands, DiscPlastics } from '@/app/constants/discData';
import clsx from 'clsx';
import MultiSelect from '@/components/ui/MultiSelect';
import { z } from 'zod';

type EditableUserFields = z.infer<typeof editableProfileSchema>;

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<Partial<EditableUserFields>>({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'disc' | 'play'>('basic');
  const [discCount, setDiscCount] = useState<number>(0);

  // 🧠 Fetch profile data including discCount
  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/profile')
        .then((res) => res.json())
        .then((data) => {
          if (!data.user) return;

          // Remove location because coordinates may be empty and cause Zod errors
          const userData = { ...data.user };
          delete userData.location;

          // Parse remaining fields with Zod
          const parsed = editableProfileSchema.parse(userData);
          setProfile(parsed);
          setDiscCount(data.user.discCount || 0);
        })
        .catch((err) => console.error('Error loading profile:', err));
    }
  }, [status]);


  if (status === 'loading') return <p className="p-4">Loading...</p>;
  if (!session?.user) return <p className="p-4 text-center text-gray-600">Log in to view profile</p>;

  const handleSave = async () => {
    setLoading(true);
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    setLoading(false);
    if (!res.ok) console.error('Failed to save profile');
  };

  // 🧮 Profile completion calculation
  const defaults: Partial<Record<keyof EditableUserFields, any>> = {
    dominantHand: 'Right',
    throwStyle: 'Backhand',
    stabilityPreference: 'Straight',
    armSpeed: 'Medium',
    skillLevel: 'Intermediate',
    playFrequency: '1-2 times per week',
    favoriteBrands: [],
    preferredDiscTypes: [],
    preferredPlastics: [],
    name: '',
    username: '',
    bio: '',
    pdgaNumber: 0,
    homeCourse: '',
    goals: '',
  };

  const profileFields: (keyof EditableUserFields)[] = [
    'name', 'username', 'bio',
    'pdgaNumber', 'homeCourse', 'goals',
    'dominantHand', 'throwStyle', 'favoriteBrands',
    'preferredDiscTypes', 'stabilityPreference', 'armSpeed',
    'skillLevel', 'playFrequency', 'preferredPlastics'
  ];

  const filledFields = profileFields.filter((f) => {
    const value = profile[f] ?? defaults[f];
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'number') return value !== 0;
    return value !== null && value !== undefined;
  }).length;

  const completionPercent = Math.round((filledFields / profileFields.length) * 100);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Welcome, {profile.name || profile.username || session.user.name}
        </h1>

        {/* Disc Count Badge */}
        <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
          {discCount} Disc{discCount !== 1 ? 's' : ''}
        </div>
      </div>

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
        {['basic', 'disc', 'play'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={clsx(
              'px-4 py-2 rounded-t-lg font-medium',
              activeTab === tab
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            )}
          >
            {tab === 'basic' ? 'Basic Info' : tab === 'disc' ? 'Disc Golf Info' : 'Play Style'}
          </button>
        ))}
      </div>

      {/* Panels */}
      <div className="bg-white p-4 rounded-b-lg shadow-sm border space-y-4">
        {activeTab === 'basic' && (
          <>
            <label className="block font-medium">Name</label>
            <input
              type="text"
              value={profile.name ?? ''}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="border px-3 py-2 rounded w-full"
            />

            <label className="block font-medium">Username</label>
            <input
              type="text"
              value={profile.username ?? ''}
              onChange={(e) => setProfile({ ...profile, username: e.target.value })}
              className="border px-3 py-2 rounded w-full"
            />

            <label className="block font-medium">Bio</label>
            <textarea
              value={profile.bio ?? ''}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              className="border px-3 py-2 rounded w-full"
            />
          </>
        )}

        {activeTab === 'disc' && (
          <>
            <label className="block font-medium">PDGA Number</label>
            <input
              type="number"
              value={profile.pdgaNumber ?? ''}
              onChange={(e) =>
                setProfile({ ...profile, pdgaNumber: Number(e.target.value) })
              }
              className="border px-3 py-2 rounded w-full"
            />

            <label className="block font-medium">Home Course</label>
            <input
              type="text"
              value={profile.homeCourse ?? ''}
              onChange={(e) => setProfile({ ...profile, homeCourse: e.target.value })}
              className="border px-3 py-2 rounded w-full"
            />

            <label className="block font-medium">Goals</label>
            <input
              type="text"
              value={profile.goals ?? ''}
              onChange={(e) => setProfile({ ...profile, goals: e.target.value })}
              className="border px-3 py-2 rounded w-full"
            />
          </>
        )}

        {activeTab === 'play' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label className="block font-medium">Dominant Hand</label>
      <select
        value={profile.dominantHand ?? 'Right'}
        onChange={(e) =>
          setProfile({
            ...profile,
            dominantHand: e.target.value as EditableUserFields['dominantHand'],
          })
        }
        className="border px-3 py-2 rounded w-full"
      >
        <option>Left</option>
        <option>Right</option>
        <option>Both</option>
      </select>
    </div>

    <div>
      <label className="block font-medium">Throw Style</label>
      <select
        value={profile.throwStyle ?? 'Backhand'}
        onChange={(e) =>
          setProfile({
            ...profile,
            throwStyle: e.target.value as EditableUserFields['throwStyle'],
          })
        }
        className="border px-3 py-2 rounded w-full"
      >
        <option>Backhand</option>
        <option>Forehand</option>
        <option>Both</option>
      </select>
    </div>

    <div className="col-span-1 md:col-span-2">
      <MultiSelect
        label="Favorite Brands"
        options={[...DiscBrands]}
        value={profile.favoriteBrands ?? []}
        onChange={(val) =>
          setProfile({
            ...profile,
            favoriteBrands: val as EditableUserFields['favoriteBrands'],
          })
        }
      />
    </div>

    <div className="col-span-1 md:col-span-2">
      <MultiSelect
        label="Preferred Disc Types"
        options={['Putter', 'Midrange', 'Fairway Driver', 'Distance Driver']}
        value={profile.preferredDiscTypes ?? []}
        onChange={(val) =>
          setProfile({
            ...profile,
            preferredDiscTypes: val as EditableUserFields['preferredDiscTypes'],
          })
        }
      />
    </div>

    <div>
      <label className="block font-medium">Stability Preference</label>
      <select
        value={profile.stabilityPreference ?? 'Straight'}
        onChange={(e) =>
          setProfile({
            ...profile,
            stabilityPreference: e.target.value as EditableUserFields['stabilityPreference'],
          })
        }
        className="border px-3 py-2 rounded w-full"
      >
        <option>Straight</option>
        <option>Overstable</option>
        <option>Understable</option>
      </select>
    </div>

    <div>
      <label className="block font-medium">Arm Speed</label>
      <select
        value={profile.armSpeed ?? 'Medium'}
        onChange={(e) =>
          setProfile({
            ...profile,
            armSpeed: e.target.value as EditableUserFields['armSpeed'],
          })
        }
        className="border px-3 py-2 rounded w-full"
      >
        <option>Slow</option>
        <option>Medium</option>
        <option>Fast</option>
      </select>
    </div>

    <div>
      <label className="block font-medium">Skill Level</label>
      <select
        value={profile.skillLevel ?? 'Intermediate'}
        onChange={(e) =>
          setProfile({
            ...profile,
            skillLevel: e.target.value as EditableUserFields['skillLevel'],
          })
        }
        className="border px-3 py-2 rounded w-full"
      >
        <option>Beginner</option>
        <option>Intermediate</option>
        <option>Advanced</option>
        <option>Pro</option>
      </select>
    </div>

    <div>
      <label className="block font-medium">Play Frequency</label>
      <select
        value={profile.playFrequency ?? '1-2 times per week'}
        onChange={(e) =>
          setProfile({
            ...profile,
            playFrequency: e.target.value as EditableUserFields['playFrequency'],
          })
        }
        className="border px-3 py-2 rounded w-full"
      >
        <option>&lt;1 per week</option>
        <option>1-2 times per week</option>
        <option>Every day</option>
      </select>
    </div>

    <div className="col-span-1 md:col-span-2">
      <MultiSelect
        label="Preferred Plastics"
        options={[...DiscPlastics]}
        value={profile.preferredPlastics ?? []}
        onChange={(val) =>
          setProfile({
            ...profile,
            preferredPlastics: val as EditableUserFields['preferredPlastics'],
          })
        }
      />
    </div>
          </div>
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
