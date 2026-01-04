'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';
import { editableProfileSchema } from '@/lib/validation/userSchema';
import { z } from 'zod';
import toast from 'react-hot-toast';
import GradientButton from '@/components/ui/GradientButton';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileProgress from '@/components/profile/ProfileProgress';
import ProfileTabs from '@/components/profile/ProfileTabs';
import ProfileBasicTab from '@/components/profile/ProfileBasicTab';
import ProfileDiscTab from '@/components/profile/ProfileDiscTab';
import ProfilePlayTab from '@/components/profile/ProfilePlayTab';
import ProfileStoreTab from '@/components/profile/ProfileStoreTab';
import UserRating from '@/components/ratings/UserRating';
import RatingsList from '@/components/ratings/RatingsList';

type EditableUserFields = z.infer<typeof editableProfileSchema>;

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<Partial<EditableUserFields> & { role?: string }>({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'disc' | 'play' | 'store'>('basic');
  const [discCount, setDiscCount] = useState(0);
  const [userRole, setUserRole] = useState<string>('user');
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [ratingCount, setRatingCount] = useState(0);
  const [ratings, setRatings] = useState<Array<{
    _id: string;
    rating: number;
    review?: string;
    createdAt: string;
    rater: {
      _id: string;
      name?: string;
      username?: string;
      avatarUrl?: string;
    } | null;
  }>>([]);
  const [ratingsPage, setRatingsPage] = useState(1);
  const [ratingsTotalPages, setRatingsTotalPages] = useState(1);

  // --- Fetch profile ---
  const fetchProfile = useCallback(() => {
    if (status === 'authenticated') {
      // Add cache-busting query parameter to ensure fresh data
      fetch(`/api/profile?t=${Date.now()}`)
        .then((res) => res.json())
        .then((data) => {
          if (!data.user) return;
          const userData = { ...data.user };
          setUserRole(data.user.role || 'user');
          // Keep location for store tab, but don't include in Zod parse
          const locationData = userData.location;
          delete userData.location; // 🧩 prevent Zod from parsing this field
          const parsed = editableProfileSchema.parse(userData);
          setProfile({ ...parsed, location: locationData, role: data.user.role });
          setDiscCount(data.user.discCount || 0);
          setAverageRating(data.user.averageRating ?? null);
          setRatingCount(data.user.ratingCount || 0);
        })
        .catch((err) => console.error('Error loading profile:', err));
    }
  }, [status]);

  // --- Fetch ratings ---
  const fetchRatings = useCallback(() => {
    if (status === 'authenticated' && session?.user) {
      const userId = (session.user as { id?: string }).id;
      if (!userId) return;

      fetch(`/api/users/${userId}/ratings?page=${ratingsPage}&limit=10`)
        .then((res) => res.json())
        .then((data) => {
          if (data.ratings) {
            setRatings(data.ratings);
            setAverageRating(data.averageRating ?? null);
            setRatingCount(data.ratingCount || 0);
            setRatingsTotalPages(data.pagination?.totalPages || 1);
          }
        })
        .catch((err) => console.error('Error loading ratings:', err));
    }
  }, [status, session, ratingsPage]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    fetchRatings();
  }, [fetchRatings]);


  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      
      if (response.ok) {
        toast.success('Profile saved successfully!');
        // Refresh profile data to get any server-side updates
        fetchProfile();
      } else {
        toast.error('Failed to save profile. Please try again.');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading')
    return <p className="p-6 text-center text-[var(--foreground)]/70">Loading...</p>;

  if (!session?.user)
    return <p className="p-6 text-center text-[var(--foreground)]/70">Log in to view profile</p>;

  // --- Profile completion ---
  // Default values for fields that have defaults in the UI
  const fieldDefaults: Partial<Record<keyof EditableUserFields, string>> = {
    dominantHand: 'Right',
    throwStyle: 'Backhand',
    stabilityPreference: 'Straight',
    armSpeed: 'Medium',
    skillLevel: 'Intermediate',
    playFrequency: '1-2 times per week',
  };

  const profileFields: (keyof EditableUserFields)[] = [
    'name', 'username', 'bio',
    'pdgaNumber', 'homeCourse', 'goals',
    'dominantHand', 'throwStyle', 'favoriteBrands',
    'preferredDiscTypes', 'stabilityPreference', 'armSpeed',
    'skillLevel', 'playFrequency', 'preferredPlastics',
  ];

  const filledFields = profileFields.filter((f) => {
    const val = profile[f];
    
    // If field has a default value, count it as filled (even if not explicitly set)
    if (fieldDefaults[f]) {
      return true;
    }
    
    // Otherwise, check if the field has a value
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

      {/* User Rating */}
      <div className="bg-[var(--surface)] p-5 rounded-2xl shadow-md border border-[var(--muted)]/30">
        <UserRating
          averageRating={averageRating}
          ratingCount={ratingCount}
          size="md"
        />
      </div>

      {/* Ratings List */}
      {ratingCount > 0 && (
        <div className="bg-[var(--surface)] p-5 rounded-2xl shadow-md border border-[var(--muted)]/30">
          <RatingsList
            ratings={ratings}
            averageRating={averageRating}
            ratingCount={ratingCount}
            currentPage={ratingsPage}
            totalPages={ratingsTotalPages}
            onPageChange={(page) => {
              setRatingsPage(page);
            }}
          />
        </div>
      )}

      <ProfileProgress percent={completionPercent} />

      <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="bg-[var(--surface)] p-5 sm:p-6 rounded-2xl shadow-md border border-[var(--muted)]/30 space-y-5">
        {activeTab === 'basic' && <ProfileBasicTab profile={profile} setProfile={setProfile} />}
        {activeTab === 'disc' && <ProfileDiscTab profile={profile} setProfile={setProfile} />}
        {activeTab === 'play' && <ProfilePlayTab profile={profile} setProfile={setProfile} />}
        {activeTab === 'store' && <ProfileStoreTab profile={profile} setProfile={setProfile} userRole={userRole} />}
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
