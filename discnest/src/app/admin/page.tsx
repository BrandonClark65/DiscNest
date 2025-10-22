'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import type { DiscNestUser } from '@/types/user';
import type { Disc } from '@/types/disc';
import type { ListingAdmin } from '@/types/listing';
import Image from 'next/image';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

type DiscStat = { date: string; count: number };

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'stats' | 'discs' | 'users' | 'pending'>('stats');
  const [stats, setStats] = useState<DiscStat[]>([]);
  const [discs, setDiscs] = useState<Disc[]>([]);
  const [users, setUsers] = useState<DiscNestUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [flagFilter, setFlagFilter] = useState('');
  const [pendingListings, setPendingListings] = useState<ListingAdmin[]>([]);

  useEffect(() => {
    if (activeTab === 'pending') fetchPendingListings();
  }, [activeTab]);

  const fetchPendingListings = async () => {
    try {
      const res = await fetch('/api/admin/listings');
      if (!res.ok) throw new Error('Failed to fetch pending listings');
      const data = await res.json();
      setPendingListings(data.listings);
    } catch (err) {
      console.error(err);
    }
  };

  const handleModeration = async (listingId: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch('/api/admin/listings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, action }),
      });
      if (!res.ok) throw new Error('Moderation failed');
      setPendingListings(prev => prev.filter(l => l._id !== listingId));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (status === 'loading') return;
    if (session?.user?.role !== 'admin') {
      router.push('/');
    } else {
      Promise.all([
        fetch('/api/disc-stats').then(res => res.json()).then(setStats),
        fetch('/api/discs').then(res => res.json()).then(setDiscs),
        fetch('/api/admin/users').then(res => res.json()).then(data => setUsers(data.users || []))
      ]).catch(console.error);
    }
  }, [session, status]);

  const handleSeed = async () => {
    setLoading(true);
    try {
      await fetch('/api/seed', { method: 'POST' });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels: stats.map(s => s.date),
    datasets: [
      {
        label: 'Discs Added',
        data: stats.map(s => s.count),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        fill: true,
        tension: 0.3,
      },
    ],
  };

  return (
    <div className="p-4 sm:p-6 space-y-8">
      <h1 className="text-2xl font-bold text-center sm:text-left">DiscNest Admin</h1>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b mb-6 space-x-4 pb-2 scrollbar-hide">
        {[
          { key: 'stats', label: 'Dashboard' },
          { key: 'discs', label: 'Disc Catalog' },
          { key: 'users', label: 'Users' },
          { key: 'pending', label: 'Pending Listings' },
        ].map(tab => (
          <button
            key={tab.key}
            className={`whitespace-nowrap px-4 py-2 transition-colors ${
              activeTab === tab.key
                ? 'border-b-2 border-blue-500 font-bold text-blue-600'
                : 'text-gray-600 hover:text-blue-500'
            }`}
            onClick={() => setActiveTab(tab.key as any)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* --- STATS TAB --- */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          <button
            onClick={handleSeed}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded w-full sm:w-auto"
          >
            {loading ? 'Seeding...' : 'Run Seed Script'}
          </button>

          <div className="w-full sm:max-w-4xl mx-auto">
            <h2 className="text-lg sm:text-xl font-semibold mb-2 text-center sm:text-left">
              Discs Added Over Time
            </h2>
            <div className="bg-white p-4 rounded shadow-sm">
              <Line data={chartData} />
            </div>
          </div>
        </div>
      )}

      {/* --- DISCS TAB --- */}
      {activeTab === 'discs' && (
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold mb-2 text-center sm:text-left">
            Current Disc Catalog
          </h2>
          <div className="flex flex-col sm:flex-row flex-wrap gap-4 mb-4">
            <input
              type="text"
              placeholder="Search by name or type"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="border px-3 py-2 rounded w-full sm:w-64"
            />
            <select
              value={filterBrand}
              onChange={e => setFilterBrand(e.target.value)}
              className="border px-3 py-2 rounded w-full sm:w-64"
            >
              <option value="">All Brands</option>
              {[...new Set(discs.map(d => d.brand))].sort().map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>

          {/* Responsive Table */}
          <div className="overflow-x-auto border rounded shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Brand</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Added</th>
                </tr>
              </thead>
              <tbody>
                {discs
                  .filter(d =>
                    (!filterBrand || d.brand === filterBrand) &&
                    (d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (d.type?.toLowerCase() || '').includes(searchTerm.toLowerCase()))
                  )
                  .map((disc, i) => (
                    <tr key={i} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2">{disc.name}</td>
                      <td className="px-4 py-2">{disc.brand}</td>
                      <td className="px-4 py-2">{disc.type || '—'}</td>
                      <td className="px-4 py-2">
                        {disc.addedAt ? new Date(disc.addedAt).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- USERS TAB --- */}
      {activeTab === 'users' && (
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold mb-2 text-center sm:text-left">All Users</h2>

          <div className="flex flex-col sm:flex-row flex-wrap gap-4 mb-4">
            <input
              type="text"
              placeholder="Search by name or email"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="border px-3 py-2 rounded w-full sm:w-64"
            />
            <select
              value={filterBrand}
              onChange={e => setFilterBrand(e.target.value)}
              className="border px-3 py-2 rounded w-full sm:w-64"
            >
              <option value="">All Roles</option>
              {[...new Set(users.map(u => u.role))].sort().map((role, i) => (
                <option key={i} value={role}>{role}</option>
              ))}
            </select>
            <select
              value={flagFilter}
              onChange={e => setFlagFilter(e.target.value)}
              className="border px-3 py-2 rounded w-full sm:w-64"
            >
              <option value="">All Users</option>
              <option value="flagged">Flagged Only</option>
              <option value="clean">Clean Only</option>
            </select>
          </div>

          <div className="overflow-x-auto border rounded shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Role</th>
                  <th className="px-4 py-2 text-center">Flags</th>
                  <th className="px-4 py-2 text-left">Last Flagged</th>
                  <th className="px-4 py-2 text-left">Last Login</th>
                </tr>
              </thead>
              <tbody>
                {users
                  .filter(u => {
                    const matchesRole = !filterBrand || u.role === filterBrand;
                    const matchesSearch =
                      (u.name?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
                      (u.email?.toLowerCase() ?? '').includes(searchTerm.toLowerCase());
                    const matchesFlag =
                      flagFilter === ''
                        ? true
                        : flagFilter === 'flagged'
                        ? (u.moderationFlags ?? 0) > 0
                        : (u.moderationFlags ?? 0) === 0;
                    return matchesRole && matchesSearch && matchesFlag;
                  })
                  .map((user, i) => (
                    <tr key={i} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2">{user.name}</td>
                      <td className="px-4 py-2">{user.email}</td>
                      <td className="px-4 py-2">{user.role}</td>
                      <td
                        className={`px-4 py-2 text-center font-semibold ${
                          (user.moderationFlags ?? 0) > 0 ? 'text-red-600' : 'text-green-600'
                        }`}
                      >
                        {user.moderationFlags || 0}
                      </td>
                      <td className="px-4 py-2">
                        {user.lastFlaggedAt ? new Date(user.lastFlaggedAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-2 text-gray-600 text-sm">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- PENDING LISTINGS TAB --- */}
      {activeTab === 'pending' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <h2 className="text-xl font-semibold mb-4 text-center sm:text-left">
            Pending Listings Moderation
          </h2>

          {pendingListings.length === 0 ? (
            <p className="text-gray-600 text-center">No pending listings</p>
          ) : (
            pendingListings.map(listing => (
              <div
                key={listing._id}
                className="border rounded-lg p-4 space-y-4 shadow-sm bg-white"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  {listing.imageUrls?.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto sm:w-1/3">
                      {listing.imageUrls.map((url, i) => (
                        <div
                          key={i}
                          className="relative w-32 h-32 flex-shrink-0 rounded overflow-hidden shadow-md"
                        >
                          <Image
                            src={url}
                            alt={listing.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 160px"
                            unoptimized
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/fallback.jpg';
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex-1 space-y-1 text-sm sm:text-base">
                    <p><strong>Title:</strong> {listing.title}</p>
                    <p><strong>User:</strong> {listing.userId?.name} ({listing.userId?.email})</p>
                    <p><strong>Brand:</strong> {listing.brand || '-'}</p>
                    <p><strong>Plastic:</strong> {listing.plastic || '-'}</p>
                    <p><strong>Condition:</strong> {listing.condition}</p>
                    <p><strong>Price:</strong> {listing.price ? `$${listing.price.toFixed(2)}` : 'Not listed'}</p>
                    <p><strong>Submitted:</strong> {listing.createdAt ? new Date(listing.createdAt).toLocaleString() : '-'}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded w-full sm:w-auto"
                    onClick={() => handleModeration(listing._id, 'approve')}
                  >
                    Approve
                  </button>
                  <button
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded w-full sm:w-auto"
                    onClick={() => handleModeration(listing._id, 'reject')}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
