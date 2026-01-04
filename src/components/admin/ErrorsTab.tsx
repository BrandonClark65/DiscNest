'use client';

import { useEffect, useState, useMemo } from 'react';
import { X } from 'lucide-react';
import Pagination from './Pagination';

const ITEMS_PER_PAGE = 25;

export default function ErrorsTab() {
  interface ErrorLog {
    _id: string;
    message: string;
    route?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    source: 'client' | 'server';
    userId?: { name?: string; email?: string };
    createdAt: string;
    resolved?: boolean;
    metadata?: Record<string, unknown>;
    stack?: string;
  }

  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<ErrorLog | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchErrorLogs = async () => {
    try {
      const res = await fetch('/api/admin/errors');
      const data = await res.json();
      // Ensure logs are properly typed
      const logs = (data.logs || []) as ErrorLog[];
      setErrorLogs(logs);
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
      setErrorLogs((prev) =>
        prev.map((log) => (log._id === id ? { ...log, resolved } : log))
      );
    } catch (err) {
      console.error('Failed to update log:', err);
    }
  };

  useEffect(() => {
    fetchErrorLogs();
  }, []);

  const totalPages = Math.ceil(errorLogs.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = useMemo(
    () => errorLogs.slice(startIdx, startIdx + ITEMS_PER_PAGE),
    [errorLogs, currentPage]
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h2 className="text-xl font-semibold mb-4 text-center sm:text-left">Logged Errors</h2>

      {errorLogs.length === 0 ? (
        <p className="text-gray-600 text-center">No error logs found.</p>
      ) : (
        <>
          <div className="overflow-x-auto border rounded shadow-sm bg-white">
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
                {currentItems.map((log, i) => (
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
                          log.source === 'client'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-200 text-gray-800'
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
                        onClick={() => setSelectedLog(log)}
                        className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs"
                      >
                        View
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

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </>
      )}

      {/* Modal */}
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
  );
}
