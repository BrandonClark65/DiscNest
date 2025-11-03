'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { editableProfileSchema, type UserSchema } from '@/lib/validation/userSchema';
import { DiscBrands, DiscPlastics } from '@/app/constants/discData';
import clsx from 'clsx';
import MultiSelect from '@/components/ui/MultiSelect';
import GradientButton from '@/components/ui/GradientButton';
import { z } from 'zod';

type EditableUserFields = z.infer<typeof editableProfileSchema>;

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<Partial<EditableUserFields>>({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'disc' | 'play'>('basic');
  const [discCount, setDiscCount] = useState<number>(0);

  // Fetch profile data
  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/profile')
        .then((res) => res.json())
        .then((data) => {
          if (!data.user) return;
          const userData = { ...data.user };
          delete userData.location;
          const parsed = editableProfileSchema.parse(userData);
          setProfile(parsed);
          setDiscCount(data.user.discCount || 0);
        })
        .catch((err) => console.error('Error loading profile:', err));
    }
  }, [status]);

  if (status === 'loading') return <p className="p-6 text-center text-[var(--foreground)]/70">Loading...</p>;
  if (!session?.user)
    return <p className="p-6 text-center text-[var(--foreground)]/70">Log in to view profile</p>;

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
    const val = profile[f];
    if (Array.isArray(val)) return val.length > 0;
    if (typeof val === 'string') return val.trim().length > 0;
    if (typeof val === 'number') return val > 0;
    return !!val;
  }).length;
  const completionPercent = Math.round((filledFields / profileFields.length) * 100);

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-8 text-[var(--foreground)]">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] drop-shadow-sm">
          Welcome, {profile.name || profile.username || session.user.name}
        </h1>

        <div className="bg-[var(--primary)] text-[var(--background)] px-3 py-1 rounded-full text-sm font-semibold shadow-sm">
          {discCount} Disc{discCount !== 1 ? 's' : ''}
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div>
        <div className="w-full bg-[var(--surface)] rounded-full h-3 shadow-inner">
          <div
            className="h-3 rounded-full transition-all bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
        <p className="text-sm text-[var(--foreground)]/70 mt-1 text-center sm:text-left">
          Profile Completion: {completionPercent}%
        </p>
      </div>

      {/* TABS */}
      <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-4">
        {['basic', 'disc', 'play'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={clsx(
              'px-4 py-2 rounded-lg font-semibold transition-all duration-200',
              activeTab === tab
                ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white shadow-sm scale-[1.02]'
                : 'bg-[var(--surface)] text-[var(--foreground)]/80 hover:bg-[var(--muted)]/20'
            )}
          >
            {tab === 'basic' ? 'Basic Info' : tab === 'disc' ? 'Disc Golf Info' : 'Play Style'}
          </button>
        ))}
      </div>

      {/* PANEL */}
      <div className="bg-[var(--surface)] p-5 sm:p-6 rounded-2xl shadow-md border border-[var(--muted)]/30 space-y-5">
        {activeTab === 'basic' && (
          <div className="space-y-4">
            {['name', 'username', 'bio'].map((field) => (
              <div key={field}>
                <label className="block font-medium capitalize mb-1">{field}</label>
                {field === 'bio' ? (
                  <textarea
                    value={profile.bio ?? ''}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    className="bg-[var(--background)] border border-[var(--muted)]/40 px-3 py-2 rounded-lg w-full min-h-[80px] focus:ring-2 focus:ring-[var(--accent)]/40"
                  />
                ) : (
                  <input
                    type="text"
                    value={profile[field as keyof EditableUserFields] as string ?? ''}
                    onChange={(e) => setProfile({ ...profile, [field]: e.target.value })}
                    className="bg-[var(--background)] border border-[var(--muted)]/40 px-3 py-2 rounded-lg w-full focus:ring-2 focus:ring-[var(--accent)]/40"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'disc' && (
          <div className="space-y-4">
            {[
              { key: 'pdgaNumber', label: 'PDGA Number', type: 'number' },
              { key: 'homeCourse', label: 'Home Course', type: 'text' },
              { key: 'goals', label: 'Goals', type: 'text' },
            ].map(({ key, label, type }) => (
              <div key={key}>
                <label className="block font-medium mb-1">{label}</label>
                <input
                  type={type}
                  value={
                    typeof profile[key as keyof EditableUserFields] === 'object'
                      ? ''
                      : (profile[key as keyof EditableUserFields] as string | number | undefined) ?? ''
                  }
                  onChange={(e) =>
                    setProfile({ ...profile, [key]: type === 'number' ? Number(e.target.value) : e.target.value })
                  }
                  className="bg-[var(--background)] border border-[var(--muted)]/40 px-3 py-2 rounded-lg w-full focus:ring-2 focus:ring-[var(--accent)]/40"
                />
              </div>
            ))}
          </div>
        )}

        {activeTab === 'play' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Select + MultiSelect sections */}
            <div>
              <label className="block font-medium">Dominant Hand</label>
              <select
                value={profile.dominantHand ?? 'Right'}
                onChange={(e) => setProfile({ ...profile, dominantHand: e.target.value as EditableUserFields['dominantHand'] })}
                className="bg-[var(--background)] border border-[var(--muted)]/40 px-3 py-2 rounded-lg w-full"
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
                onChange={(e) => setProfile({ ...profile, throwStyle: e.target.value as EditableUserFields['throwStyle'] })}
                className="bg-[var(--background)] border border-[var(--muted)]/40 px-3 py-2 rounded-lg w-full"
              >
                <option>Backhand</option>
                <option>Forehand</option>
                <option>Both</option>
              </select>
            </div>

            <div className="col-span-2">
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

            <div className="col-span-2">
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
                onChange={(e) => setProfile({ ...profile, stabilityPreference: e.target.value as EditableUserFields['stabilityPreference'] })}
                className="bg-[var(--background)] border border-[var(--muted)]/40 px-3 py-2 rounded-lg w-full"
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
                onChange={(e) => setProfile({ ...profile, armSpeed: e.target.value as EditableUserFields['armSpeed'] })}
                className="bg-[var(--background)] border border-[var(--muted)]/40 px-3 py-2 rounded-lg w-full"
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
                onChange={(e) => setProfile({ ...profile, skillLevel: e.target.value as EditableUserFields['skillLevel'] })}
                className="bg-[var(--background)] border border-[var(--muted)]/40 px-3 py-2 rounded-lg w-full"
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
                onChange={(e) => setProfile({ ...profile, playFrequency: e.target.value as EditableUserFields['playFrequency'] })}
                className="bg-[var(--background)] border border-[var(--muted)]/40 px-3 py-2 rounded-lg w-full"
              >
                <option>&lt;1 per week</option>
                <option>1-2 times per week</option>
                <option>Every day</option>
              </select>
            </div>

            <div className="col-span-2">
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

      {/* SAVE BUTTON */}
      <div className="flex justify-center sm:justify-end">
        <GradientButton
          label={loading ? 'Saving...' : 'Save Profile'}
          onClick={handleSave}
          variant="primary"
          className="px-8 py-3"
        />
      </div>
    </div>
  );
}
