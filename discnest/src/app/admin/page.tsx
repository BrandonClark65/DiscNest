'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import type { DiscNestUser } from '@/types/user';
import type { Disc } from '@/types/disc';
import type { ListingAdmin } from '@/types/listing';
import Image from 'next/image';
import { X } from 'lucide-react';

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

  const [activeTab, setActiveTab] = useState<'stats' | 'discs' | 'users' | 'pending' | 'errors'>('stats');
  const [stats, setStats] = useState<DiscStat[]>([]);
  const [discs, setDiscs] = useState<Disc[]>([]);
  const [users, setUsers] = useState<DiscNestUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [flagFilter, setFlagFilter] = useState('');
  const [pendingListings, setPendingListings] = useState<ListingAdmin[]>([]);
  const [errorLogs, setErrorLogs] = useState<any[]>([]);
  const [selectedLog, setSelectedLog] = useState<any | null>(null); // ✅ NEW — for modal

  // --- Fetch data when switching tabs ---
  useEffect(() => {
    if (activeTab === 'pending') fetchPendingListings();
    if (activeTab === 'errors') fetchErrorLogs();
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

  const fetchErrorLogs = async () => {
    try {
      const res = await fetch('/api/admin/errors');
      if (!res.ok) throw new Error('Failed to fetch error logs');
      const data = await res.json();
      setErrorLogs(data.logs || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolve = async (id: string, resolved: boolean) => {
    try {
      await fetch('/api/admin/errors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, resolved }),
      });
      setErrorLogs(prev =>
        prev.map(log => (log._id === id ? { ...log, resolved } : log))
      );
    } catch (err) {
      console.error('Failed to update log:', err);
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

  // --- Initial load ---
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
          { key: 'errors', label: 'Errors' },
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
          {/* ... your existing Discs tab code remains unchanged ... */}
        </div>
      )}

      {/* --- USERS TAB --- */}
      {activeTab === 'users' && (
        <div className="max-w-4xl mx-auto">
          {/* ... your existing Users tab code remains unchanged ... */}
        </div>
      )}

      {/* --- PENDING LISTINGS TAB --- */}
      {activeTab === 'pending' && (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* ... your existing Pending Listings tab code remains unchanged ... */}
        </div>
      )}

      {/* --- ERRORS TAB --- */}
      {activeTab === 'errors' && (
        <div className="max-w-5xl mx-auto space-y-6">
          <h2 className="text-xl font-semibold mb-4 text-center sm:text-left">
            Logged Errors
          </h2>

          {errorLogs.length === 0 ? (
            <p className="text-gray-600 text-center">No error logs found.</p>
          ) : (
            <div className="overflow-x-auto border rounded shadow-sm">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left">Message</th>
                    <th className="px-4 py-2 text-left">Route</th>
                    <th className="px-4 py-2 text-left">Severity</th>
                    <th className="px-4 py-2 text-left">Source</th>
                    <th className="px-4 py-2 text-left">User</th>
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {errorLogs.map((log, i) => (
                    <tr key={i} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2 max-w-xs truncate" title={log.message}>
                        {log.message}
                      </td>
                      <td className="px-4 py-2">{log.route || '—'}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            log.severity === 'critical'
                              ? 'bg-red-100 text-red-700'
                              : log.severity === 'high'
                              ? 'bg-orange-100 text-orange-700'
                              : log.severity === 'medium'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {log.severity}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            log.source === "client"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-200 text-gray-800"
                          }`}
                        >
                          {log.source}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        {log.userId?.name
                          ? `${log.userId.name} (${log.userId.email})`
                          : '—'}
                      </td>
                      <td className="px-4 py-2 text-gray-600 text-sm">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-center space-x-2">
                        <button
                          onClick={() => setSelectedLog(log)} // ✅ open modal
                          className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handleResolve(log._id, !log.resolved)}
                          className={`px-3 py-1 rounded text-white text-xs ${
                            log.resolved
                              ? 'bg-green-600 hover:bg-green-700'
                              : 'bg-gray-600 hover:bg-gray-700'
                          }`}
                        >
                          {log.resolved ? 'Resolved' : 'Mark Resolved'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ✅ Modal for viewing details */}
          {selectedLog && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
              <div className="bg-white rounded-lg max-w-2xl w-full p-6 relative shadow-lg overflow-y-auto max-h-[90vh]">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="absolute top-3 right-3 text-gray-600 hover:text-gray-900"
                >
                  <X className="w-5 h-5" />
                </button>
                <h3 className="text-lg font-semibold mb-4">Error Details</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Message:</strong> {selectedLog.message}</p>
                  <p><strong>Route:</strong> {selectedLog.route || '—'}</p>
                  <p><strong>Severity:</strong> {selectedLog.severity}</p>
                  <p><strong>Date:</strong> {new Date(selectedLog.createdAt).toLocaleString()}</p>
                  <p><strong>User:</strong> {selectedLog.userId?.name || '—'}</p>
                  {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                    <div>
                      <strong>Metadata:</strong>
                      <pre className="bg-gray-100 p-2 rounded mt-1 text-xs overflow-x-auto">
                        {JSON.stringify(selectedLog.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                  {selectedLog.stack && (
                    <div>
                      <strong>Stack Trace:</strong>
                      <pre className="bg-gray-100 p-2 rounded mt-1 text-xs overflow-x-auto whitespace-pre-wrap">
                        {selectedLog.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
