'use client';

import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';

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
type Disc = { name: string; brand: string; type?: string; addedAt: string };

export default function AdminDashboard() {
  const [stats, setStats] = useState<DiscStat[]>([]);
  const [discs, setDiscs] = useState<Disc[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
const [filterBrand, setFilterBrand] = useState('');

  useEffect(() => {
    fetch('/api/disc-stats').then(res => res.json()).then(setStats);
    fetch('/api/discs').then(res => res.json()).then(setDiscs);
  }, []);

  const handleSeed = async () => {
    setLoading(true);
    await fetch('/api/seed', { method: 'POST' });
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

      <button
        onClick={handleSeed}
        disabled={loading}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        {loading ? 'Seeding...' : 'Run Seed Script'}
      </button>

      <div>
        <h2 className="text-xl font-semibold mb-2">Discs Added Over Time</h2>
        <Line data={chartData} />
      </div>

      <div>
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
        <div className="overflow-auto max-h-[500px] border rounded">
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
                    <td className="px-4 py-2">{new Date(disc.addedAt).toLocaleDateString()}</td>
                    </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}