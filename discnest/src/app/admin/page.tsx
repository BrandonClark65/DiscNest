'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import type { DiscNestUser } from '@/types/user';
import type { Disc } from '@/types/disc'; 

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
// type Disc = { name: string; brand: string; type?: string; addedAt: string };


export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [stats, setStats] = useState<DiscStat[]>([]);
  const [discs, setDiscs] = useState<Disc[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [users, setUsers] = useState<DiscNestUser[]>([]);


  useEffect(() => {
    if (status === 'loading') return;

    if (session?.user?.role !== 'admin') {
      router.push('/');
    } else {
      console.log('✅ Admin access granted — fetching data');

      fetch('/api/disc-stats', {
        method: 'GET',
        credentials: 'include',
      })
        .then(async res => {
          console.log('📊 /api/disc-stats response:', res.status);
          const body = await res.json();

          if (!res.ok) {
            console.error('❌ Error body:', body);
            throw new Error(`Failed to fetch stats: ${res.status}`);
          }

          console.log('📈 Stats data:', body);
          setStats(body);
        })
        .catch(err => console.error('❌ Error fetching stats:', err));

      fetch('/api/discs', {
        method: 'GET',
        credentials: 'include', // ✅ same fix here
      })
        .then(res => {
          console.log('📦 /api/discs response:', res.status);
          if (!res.ok) throw new Error(`Failed to fetch discs: ${res.status}`);
          return res.json();
        })
        .then(data => {
          console.log('📋 Discs data:', data);
          setDiscs(data);
        })
        .catch(err => console.error('❌ Error fetching discs:', err));
      fetch('/api/admin/users')
        .then((res) => res.json())
        .then((data) => setUsers(data.users || []));

    }
  }, [session, status]);

  const handleSeed = async () => {
    console.log('🌱 Seeding started');
    setLoading(true);

    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      console.log('🌱 Seed response:', res.status);
      if (!res.ok) throw new Error(`Seed failed: ${res.status}`);
    } catch (err) {
      console.error('❌ Seed error:', err);
    }

    setLoading(false);
    console.log('🌱 Seeding complete');
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

      <div className="max-w-4xl">
        <h2 className="text-xl font-semibold mb-2">All Users</h2>
        <div className="flex flex-wrap gap-4 mb-4">
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
            {[...new Set(users.map(u => u.role))].sort().map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
        <div className="overflow-auto max-h-[400px] border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="text-left px-4 py-2">Name</th>
                <th className="text-left px-4 py-2">Email</th>
                <th className="text-left px-4 py-2">Role</th>
                <th className="text-left px-4 py-2">Last Login</th>
                <th className="text-left px-4 py-2">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users
                .filter(u =>
                  (!filterBrand || u.role === filterBrand) &&
                  (
                    (u.name?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
                    (u.email?.toLowerCase() ?? '').includes(searchTerm.toLowerCase())
                  )
                )
                .map((user, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-4 py-2">{user.name}</td>
                    <td className="px-4 py-2">{user.email}</td>
                    <td className="px-4 py-2">{user.role}</td>
                    <td className="text-sm text-gray-600">
                      {user.lastLogin
                        ? new Date(user.lastLogin).toLocaleString()
                        : '—'}
                    </td>
                    <td className="px-4 py-2">{user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : '—'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}