'use client';

import { useEffect, useState } from 'react';
import type { Disc } from '@/types/disc';

// ✅ Shared types (exported so CatalogFilters and CatalogPage can use them)
export type FilterState = {
  search: string;
  brands: string[];
  types: string[];
  stabilities: string[];
  speeds: string[];
};

export type OpenSections = {
  brand: boolean;
  type: boolean;
  stability: boolean;
  speed: boolean;
};

export default function useCatalogData() {
  const [discs, setDiscs] = useState<Disc[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const discsPerPage = 24;

  const [filter, setFilter] = useState<FilterState>({
    search: '',
    brands: [],
    types: [],
    stabilities: [],
    speeds: [],
  });

  const [openSections, setOpenSections] = useState<OpenSections>({
    brand: true,
    type: true,
    stability: true,
    speed: true,
  });

  // --- Load & sort discs ---
  useEffect(() => {
    fetch('/api/discs')
      .then((res) => res.json())
      .then((data: Disc[]) => {
        const sorted = [...data].sort((a, b) => {
          const brandCompare = (a.brand || '').localeCompare(b.brand || '', undefined, {
            sensitivity: 'base',
          });
          if (brandCompare !== 0) return brandCompare;
          return (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' });
        });
        setDiscs(sorted);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // --- Handle mobile ---
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Unique filter values (type-safe filtering) ---
  const uniqueBrands = Array.from(
    new Set(discs.map((d) => d.brand).filter((b): b is string => !!b))
  ).sort();

  const typeOrder = [
    'Putter',
    'Approach Discs',
    'Midrange',
    'Hybrid Driver',
    'Control Driver',
    'Distance Driver',
    'Disc Golf Sets',
  ];

  const uniqueTypes = Array.from(
    new Set(discs.map((d) => d.type).filter((t): t is string => !!t))
  ).sort((a, b) => {
    const indexA = typeOrder.indexOf(a);
    const indexB = typeOrder.indexOf(b);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.localeCompare(b);
  });

  const uniqueStabilities = Array.from(
    new Set(discs.map((d) => d.stability).filter((s): s is string => !!s))
  );

  const uniqueSpeeds = Array.from(
    new Set(discs.map((d) => d.flight?.speed).filter((s): s is number => !!s))
  )
    .sort((a, b) => a - b)
    .map(String);

  // --- Filtering logic ---
  const filtered = discs.filter((disc) => {
    const matchesSearch =
      (disc.name?.toLowerCase() || '').includes(filter.search.toLowerCase()) ||
      (disc.brand?.toLowerCase() || '').includes(filter.search.toLowerCase());

    const matchesBrand =
      filter.brands.length === 0 || filter.brands.includes(disc.brand || '');
    const matchesType =
      filter.types.length === 0 || filter.types.includes(disc.type || '');
    const matchesStability =
      filter.stabilities.length === 0 || filter.stabilities.includes(disc.stability || '');
    const matchesSpeed =
      filter.speeds.length === 0 ||
      filter.speeds.includes(String(disc.flight?.speed || ''));

    return matchesSearch && matchesBrand && matchesType && matchesStability && matchesSpeed;
  });

  // --- Pagination ---
  const totalPages = Math.ceil(filtered.length / discsPerPage);
  const startIndex = (currentPage - 1) * discsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + discsPerPage);

  // --- Handlers ---
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setCurrentPage(page);
    }
  };

  const toggleAccordion = (section: keyof OpenSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleCheckboxChange = (key: keyof FilterState, value: string) => {
    setFilter((prev) => {
      const list = prev[key] as string[];
      return {
        ...prev,
        [key]: list.includes(value)
          ? list.filter((v) => v !== value)
          : [...list, value],
      };
    });
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilter({ search: '', brands: [], types: [], stabilities: [], speeds: [] });
    setCurrentPage(1);
  };

  return {
    discs,
    filtered,
    paginated,
    uniqueBrands,
    uniqueTypes,
    uniqueStabilities,
    uniqueSpeeds,
    openSections,
    toggleAccordion,
    handleCheckboxChange,
    handleClearFilters,
    currentPage,
    handlePageChange,
    totalPages,
    filter,
    setFilter,
    isMobile,
    filtersOpen,
    setFiltersOpen,
    loading,
  };
}
