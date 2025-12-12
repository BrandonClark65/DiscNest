'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';
import { editableProfileSchema } from '@/lib/validation/userSchema';
import { z } from 'zod';
import GradientButton from '@/components/ui/GradientButton';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileProgress from '@/components/profile/ProfileProgress';
import ProfileTabs from '@/components/profile/ProfileTabs';
import ProfileBasicTab from '@/components/profile/ProfileBasicTab';
import ProfileDiscTab from '@/components/profile/ProfileDiscTab';
import ProfilePlayTab from '@/components/profile/ProfilePlayTab';

type EditableUserFields = z.infer<typeof editableProfileSchema>;

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<Partial<EditableUserFields>>({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'disc' | 'play'>('basic');
  const [discCount, setDiscCount] = useState(0);

  // --- Fetch profile ---
  const fetchProfile = useCallback(() => {
    if (status === 'authenticated') {
      // Add cache-busting query parameter to ensure fresh data
      fetch(`/api/profile?t=${Date.now()}`)
        .then((res) => res.json())
        .then((data) => {
          if (!data.user) return;
          const userData = { ...data.user };
          delete userData.location; // 🧩 prevent Zod from parsing this field
          const parsed = editableProfileSchema.parse(userData);
          setProfile(parsed);
          setDiscCount(data.user.discCount || 0);
        })
        .catch((err) => console.error('Error loading profile:', err));
    }
  }, [status]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);


  const handleSave = async () => {
    setLoading(true);
    await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    setLoading(false);
  };

  if (status === 'loading')
    return <p className="p-6 text-center text-[var(--foreground)]/70">Loading...</p>;

  if (!session?.user)
    return <p className="p-6 text-center text-[var(--foreground)]/70">Log in to view profile</p>;

  // --- Profile completion ---
  const profileFields: (keyof EditableUserFields)[] = [
    'name', 'username', 'bio',
    'pdgaNumber', 'homeCourse', 'goals',
    'dominantHand', 'throwStyle', 'favoriteBrands',
    'preferredDiscTypes', 'stabilityPreference', 'armSpeed',
    'skillLevel', 'playFrequency', 'preferredPlastics',
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
      <ProfileHeader
        name={profile.name || profile.username || session.user.name || 'User'}
        discCount={discCount}
        avatarUrl={profile.avatarUrl}
        onAvatarUpdate={fetchProfile}
      />

      <ProfileProgress percent={completionPercent} />

      <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="bg-[var(--surface)] p-5 sm:p-6 rounded-2xl shadow-md border border-[var(--muted)]/30 space-y-5">
        {activeTab === 'basic' && <ProfileBasicTab profile={profile} setProfile={setProfile} />}
        {activeTab === 'disc' && <ProfileDiscTab profile={profile} setProfile={setProfile} />}
        {activeTab === 'play' && <ProfilePlayTab profile={profile} setProfile={setProfile} />}
      </div>

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
