'use client';

import { useEffect, useState } from 'react';
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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

type DiscStat = { date: string; count: number };

export default function StatsTab() {
  const [stats, setStats] = useState<DiscStat[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/disc-stats')
      .then((res) => res.json())
      .then(setStats)
      .catch(console.error);
  }, []);

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
    labels: stats.map((s) => s.date),
    datasets: [
      {
        label: 'Discs Added',
        data: stats.map((s) => s.count),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16,185,129,0.2)',
        fill: true,
        tension: 0.3,
      },
    ],
  };

  return (
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
  );
}
