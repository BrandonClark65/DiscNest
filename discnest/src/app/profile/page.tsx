'use client';

import { useSession } from 'next-auth/react';

export default function ProfilePage() {
  const { data: session, status } = useSession();

  if (status === 'loading') return <p>Loading...</p>;
  if (!session?.user) return <p>Please log in to view your profile.</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Welcome, {session.user.name}</h1>
      <p>Email: {session.user.email}</p>
      {session.user.image && (
        <img
          src={session.user.image}
          alt="Profile"
          className="w-16 h-16 rounded-full mt-2"
        />
      )}
    </div>
  );
}