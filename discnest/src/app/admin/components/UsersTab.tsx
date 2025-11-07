'use client';

import { useEffect, useState, useMemo } from 'react';
import type { DiscNestUser } from '@/types/user';
import Pagination from './Pagination';

const ITEMS_PER_PAGE = 25;

export default function UsersTab() {
  const [users, setUsers] = useState<DiscNestUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [flagFilter, setFlagFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetch('/api/admin/users')
      .then((res) => res.json())
      .then((data) => setUsers(data.users || []))
      .catch(console.error);
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesRole = !roleFilter || u.role === roleFilter;
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
    });
  }, [users, roleFilter, searchTerm, flagFilter]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = filteredUsers.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-xl font-semibold mb-2 text-center sm:text-left">All Users</h2>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by name or email"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="border px-3 py-2 rounded w-full sm:w-64"
        />
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="border px-3 py-2 rounded w-full sm:w-64"
        >
          <option value="">All Roles</option>
          {[...new Set(users.map((u) => u.role))].sort().map((role, i) => (
            <option key={i} value={role}>
              {role}
            </option>
          ))}
        </select>
        <select
          value={flagFilter}
          onChange={(e) => {
            setFlagFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="border px-3 py-2 rounded w-full sm:w-64"
        >
          <option value="">All Users</option>
          <option value="flagged">Flagged Only</option>
          <option value="clean">Clean Only</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded shadow-sm bg-white">
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
            {currentItems.map((user, i) => (
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
            {currentItems.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            )}
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
    </div>
  );
}
