'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import TabsNav from '@/components/admin/TabsNav';
import StatsTab from '@/components/admin/StatsTab';
import DiscsTab from '@/components/admin/DiscsTab';
import UsersTab from '@/components/admin/UsersTab';
import PendingListingsTab from '@/components/admin/PendingListingsTab';
import ErrorsTab from '@/components/admin/ErrorsTab';
import FlaggedMessagesTab from '@/components/admin/FlaggedMessagesTab';
import UserReportsTab from '@/components/admin/UserReportsTab';
import ProsTab from '@/components/admin/ProsTab';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] =
    useState<'stats' | 'discs' | 'users' | 'pending' | 'errors' | 'flagged' | 'reports' | 'pros'>('stats');

  useEffect(() => {
    if (status !== 'loading' && (session?.user as { role?: string })?.role !== 'admin') {
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
      {activeTab === 'flagged' && <FlaggedMessagesTab />}
      {activeTab === 'reports' && <UserReportsTab />}
      {activeTab === 'pros' && <ProsTab />}
    </div>
  );
}
