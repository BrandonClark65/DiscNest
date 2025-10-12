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
    if (activeTab === 'pending') {
      fetchPendingListings();
    }
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
      // Fetch stats
      fetch('/api/disc-stats', { method: 'GET', credentials: 'include' })
        .then(async res => {
          const body = await res.json();
          if (!res.ok) throw new Error(`Failed to fetch stats: ${res.status}`);
          setStats(body);
        })
        .catch(err => console.error(err));

      // Fetch discs
      fetch('/api/discs', { method: 'GET', credentials: 'include' })
        .then(res => res.json())
        .then(data => setDiscs(data))
        .catch(err => console.error(err));

      // Fetch users
      fetch('/api/admin/users')
        .then((res) => res.json())
        .then((data) => setUsers(data.users || []))
        .catch(err => console.error(err));
    }
  }, [session, status]);

  const handleSeed = async () => {
    setLoading(true);
    try {
      await fetch('/api/seed', { method: 'POST' });
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const chartData = {
    labels: stats.map(s => s.date),
    datasets: [{
      label: 'Discs Added',
      data: stats.map(s => s.count),
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.2)',
      fill: true,
      tension: 0.3,
    }],
  };

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">DiscNest Admin</h1>

      {/* Tabs */}
      <div className="flex space-x-4 border-b mb-6">
        <button
          className={`px-4 py-2 ${activeTab === 'stats' ? 'border-b-2 border-blue-500 font-bold' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          Dashboard
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'discs' ? 'border-b-2 border-blue-500 font-bold' : ''}`}
          onClick={() => setActiveTab('discs')}
        >
          Disc Catalog
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'users' ? 'border-b-2 border-blue-500 font-bold' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'pending' ? 'border-b-2 border-blue-500 font-bold' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Listings
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          <button
            onClick={handleSeed}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            {loading ? 'Seeding...' : 'Run Seed Script'}
          </button>

          <div className="max-w-4xl">
            <h2 className="text-xl font-semibold mb-2">Discs Added Over Time</h2>
            <div className="bg-white p-4 rounded shadow-sm">
              <Line data={chartData} />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'discs' && (
        <div className="max-w-4xl">
          <h2 className="text-xl font-semibold mb-2">Current Disc Catalog</h2>
          <div className="flex flex-wrap gap-4 mb-4">
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
          <div className="overflow-auto max-h-[400px] border rounded">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="text-left px-4 py-2">Name</th>
                  <th className="text-left px-4 py-2">Brand</th>
                  <th className="text-left px-4 py-2">Type</th>
                  <th className="text-left px-4 py-2">Added</th>
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
                    <tr key={i} className="border-t">
                      <td className="px-4 py-2">{disc.name}</td>
                      <td className="px-4 py-2">{disc.brand}</td>
                      <td className="px-4 py-2">{disc.type || '—'}</td>
                      <td className="px-4 py-2">{disc.addedAt ? new Date(disc.addedAt).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="max-w-4xl">
          <h2 className="text-xl font-semibold mb-2">All Users</h2>
          <div className="flex flex-wrap gap-4 mb-4">
            <input
              type="text"
              placeholder="Search by name or email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border px-3 py-2 rounded w-full sm:w-64"
            />
            <select
              value={filterBrand}
              onChange={(e) => setFilterBrand(e.target.value)}
              className="border px-3 py-2 rounded w-full sm:w-64"
            >
              <option value="">All Roles</option>
              {[...new Set(users.map((u) => u.role))].sort().map((role, index) => (
                <option key={`${role}-${index}`} value={role}>{role}</option>
              ))}
            </select>
            <select
              value={flagFilter}
              onChange={(e) => setFlagFilter(e.target.value)}
              className="border px-3 py-2 rounded w-full sm:w-64"
            >
              <option value="">All Users</option>
              <option value="flagged">Flagged Only</option>
              <option value="clean">Clean Only</option>
            </select>
          </div>

          <div className="mb-2 text-sm text-gray-600">
            <strong>⚠️ {users.filter(u => (u.moderationFlags ?? 0) > 0).length}</strong> flagged users total
          </div>

          <div className="overflow-auto max-h-[400px] border rounded">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="text-left px-4 py-2">Name</th>
                  <th className="text-left px-4 py-2">Email</th>
                  <th className="text-left px-4 py-2">Role</th>
                  <th className="text-left px-4 py-2 text-center">Flags</th>
                  <th className="text-left px-4 py-2">Last Flagged</th>
                  <th className="text-left px-4 py-2">Last Login</th>
                  <th className="text-left px-4 py-2">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users
                  .filter((u) => {
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
                    <tr key={i} className="border-t">
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
                      <td className="px-4 py-2">{user.lastFlaggedAt ? new Date(user.lastFlaggedAt).toLocaleDateString() : '—'}</td>
                      <td className="text-sm text-gray-600">{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : '—'}</td>
                      <td className="px-4 py-2">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'pending' && (
        <div className="max-w-4xl space-y-6">
          <h2 className="text-xl font-semibold mb-4">Pending Listings Moderation</h2>

          {pendingListings.length === 0 ? (
            <p>No pending listings</p>
          ) : (
            pendingListings.map(listing => (
              <div key={listing._id} className="border rounded p-4 space-y-4 shadow-sm">
                <div className="flex flex-wrap gap-4">
                  {listing.imageUrls?.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto">
                      {listing.imageUrls.map((url, i) => (
                        <div key={i} className="relative w-40 h-40 flex-shrink-0 rounded overflow-hidden shadow-md">
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
                  <div className="flex-1 space-y-1">
                    <p><strong>Title:</strong> {listing.title}</p>
                    <p><strong>User:</strong> {listing.userId?.name} ({listing.userId?.email})</p>
                    <p><strong>Brand:</strong> {listing.brand || '-'}</p>
                    <p><strong>Plastic:</strong> {listing.plastic || '-'}</p>
                    <p><strong>Condition:</strong> {listing.condition}</p>
                    <p><strong>Price:</strong> {listing.price !== undefined ? `$${listing.price.toFixed(2)}` : 'Not listed'}</p>
                    <p><strong>Submitted:</strong> {listing.createdAt ? new Date(listing.createdAt).toLocaleString() : '-'}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    className="bg-green-600 text-white px-4 py-2 rounded"
                    onClick={() => handleModeration(listing._id, 'approve')}
                  >
                    Approve
                  </button>
                  <button
                    className="bg-red-600 text-white px-4 py-2 rounded"
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
