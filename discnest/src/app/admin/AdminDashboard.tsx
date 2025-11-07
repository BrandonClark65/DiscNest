'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import TabsNav from './components/TabsNav';
import StatsTab from './components/StatsTab';
import DiscsTab from './components/DiscsTab';
import UsersTab from './components/UsersTab';
import PendingListingsTab from './components/PendingListingsTab';
import ErrorsTab from './components/ErrorsTab';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] =
    useState<'stats' | 'discs' | 'users' | 'pending' | 'errors'>('stats');

  useEffect(() => {
    if (status !== 'loading' && session?.user?.role !== 'admin') {
      router.push('/');
    }
  }, [status, session, router]);

  if (status === 'loading') return <p className="p-6 text-center">Loading...</p>;

  return (
    <div className="p-4 sm:p-6 space-y-8">
      <h1 className="text-2xl font-bold text-center sm:text-left">DiscNest Admin</h1>
      <TabsNav activeTab={activeTab} setActiveTab={setActiveTab} />
      {activeTab === 'stats' && <StatsTab />}
      {activeTab === 'discs' && <DiscsTab />}
      {activeTab === 'users' && <UsersTab />}
      {activeTab === 'pending' && <PendingListingsTab />}
      {activeTab === 'errors' && <ErrorsTab />}
    </div>
  );
}
