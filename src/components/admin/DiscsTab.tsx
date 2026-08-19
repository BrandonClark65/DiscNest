'use client';

import { useEffect, useState, useMemo } from 'react';
import type { Disc } from '@/types/disc';
import Pagination from './Pagination';

const ITEMS_PER_PAGE = 25;

export default function DiscsTab() {
  const [discs, setDiscs] = useState<Disc[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetch('/api/discs')
      .then((res) => res.json())
      .then(setDiscs)
      .catch(console.error);
  }, []);

  const filteredDiscs = useMemo(() => {
    return discs.filter(
      (d) =>
        (!filterBrand || d.brand === filterBrand) &&
        (d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (d.type?.toLowerCase() || '').includes(searchTerm.toLowerCase()))
    );
  }, [discs, filterBrand, searchTerm]);

  const totalPages = Math.ceil(filteredDiscs.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = filteredDiscs.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-xl font-semibold text-center sm:text-left">Current Disc Catalog</h2>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-4">
        <input
          type="text"
          placeholder="Search by name or type"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="border px-3 py-2 rounded w-full sm:w-64"
        />
        <select
          value={filterBrand}
          onChange={(e) => {
            setFilterBrand(e.target.value);
            setCurrentPage(1);
          }}
          className="border px-3 py-2 rounded w-full sm:w-64"
        >
          <option value="">All Brands</option>
          {[...new Set(discs.map((d) => d.brand))].sort().map((brand) => (
            <option key={brand} value={brand}>
              {brand}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded shadow-sm bg-white">
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
            {currentItems.map((disc, i) => (
              <tr key={i} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2">{disc.name}</td>
                <td className="px-4 py-2">{disc.brand}</td>
                <td className="px-4 py-2">{disc.type || '-'}</td>
                <td className="px-4 py-2">
                  {disc.addedAt ? new Date(disc.addedAt).toLocaleDateString() : '-'}
                </td>
              </tr>
            ))}
            {currentItems.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                  No discs found
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
