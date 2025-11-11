'use client';
import { DiscBrands } from '@/app/constants/discData';

type Props = {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  brandFilter: string;
  setBrandFilter: (v: string) => void;
  conditionFilter: string;
  setConditionFilter: (v: string) => void;
};

export default function MarketplaceFilters({
  searchQuery,
  setSearchQuery,
  brandFilter,
  setBrandFilter,
  conditionFilter,
  setConditionFilter,
}: Props) {
  return (
    <div className="hidden md:flex gap-4 items-center mb-8">
      <input
        type="text"
        placeholder="Search discs..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="border border-[var(--muted)]/40 bg-[var(--surface)] rounded-lg px-3 py-2 w-1/3 text-foreground focus:ring-2 focus:ring-[var(--primary)]/40"
      />
      <select
        value={brandFilter}
        onChange={(e) => setBrandFilter(e.target.value)}
        className="border border-[var(--muted)]/40 bg-[var(--surface)] rounded-lg px-3 py-2 w-1/4 text-foreground focus:ring-2 focus:ring-[var(--primary)]/40"
      >
        <option value="">All Brands</option>
        {DiscBrands.map((b) => (
          <option key={b}>{b}</option>
        ))}
      </select>
      <select
        value={conditionFilter}
        onChange={(e) => setConditionFilter(e.target.value)}
        className="border border-[var(--muted)]/40 bg-[var(--surface)] rounded-lg px-3 py-2 w-1/4 text-foreground focus:ring-2 focus:ring-[var(--primary)]/40"
      >
        <option value="">Condition</option>
        <option>New</option>
        <option>Like New</option>
        <option>Used</option>
        <option>Worn</option>
      </select>
    </div>
  );
}
