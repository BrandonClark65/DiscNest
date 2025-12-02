'use client';

import React from 'react';

type FilterState = {
  search: string;
  brands: string[];
  types: string[];
  stabilities: string[];
  speeds: string[];
};

type OpenSections = {
  brand: boolean;
  type: boolean;
  stability: boolean;
  speed: boolean;
};

type Props = {
  isMobile: boolean;
  filtersOpen: boolean;
  setFiltersOpen: (v: boolean) => void;
  filter: FilterState;
  setFilter: React.Dispatch<React.SetStateAction<FilterState>>;
  openSections: OpenSections;
  toggleAccordion: (section: keyof OpenSections) => void;
  handleCheckboxChange: (key: keyof FilterState, value: string) => void;
  handleClearFilters: () => void;
  uniqueBrands: string[];
  uniqueTypes: string[];
  uniqueStabilities: string[];
  uniqueSpeeds: string[];
};

export default function CatalogFilters({
  isMobile,
  filtersOpen,
  setFiltersOpen,
  filter,
  setFilter,
  openSections,
  toggleAccordion,
  handleCheckboxChange,
  handleClearFilters,
  uniqueBrands,
  uniqueTypes,
  uniqueStabilities,
  uniqueSpeeds,
}: Props) {
  // Helper render function
  const renderSection = (section: keyof OpenSections, values: string[]) => (
    <div key={section} className="border border-muted/30 rounded-md mb-2">
      <button
        onClick={() => toggleAccordion(section)}
        className="w-full text-left font-medium px-3 py-2 flex justify-between text-foreground"
      >
        <span>{section.charAt(0).toUpperCase() + section.slice(1)}</span>
        <span>{openSections[section] ? '−' : '+'}</span>
      </button>
      {openSections[section] && (
        <div className="p-3 space-y-1 max-h-48 overflow-y-auto">
          {values.map((value) => (
            <label key={value} className="block text-sm">
              <input
                type="checkbox"
                checked={(() => {
                  switch (section) {
                    case 'brand':
                      return filter.brands.includes(value);
                    case 'type':
                      return filter.types.includes(value);
                    case 'stability':
                      return filter.stabilities.includes(value);
                    case 'speed':
                      return filter.speeds.includes(value);
                    default:
                      return false;
                  }
                })()}
                onChange={() => {
                  switch (section) {
                    case 'brand':
                      handleCheckboxChange('brands', value);
                      break;
                    case 'type':
                      handleCheckboxChange('types', value);
                      break;
                    case 'stability':
                      handleCheckboxChange('stabilities', value);
                      break;
                    case 'speed':
                      handleCheckboxChange('speeds', value);
                      break;
                  }
                }}
                className="mr-2 accent-[var(--primary)]"
              />
              {value}
            </label>
          ))}
        </div>
      )}
    </div>
  );

  // --- Mobile version ---
  if (isMobile) {
    if (!filtersOpen) return null;
    return (
      <>
        <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setFiltersOpen(false)} />
        <aside className="fixed inset-y-0 left-0 w-11/12 max-w-xs bg-surface z-50 p-4 overflow-y-auto shadow-lg border-r border-muted/30">
          <button
            onClick={() => setFiltersOpen(false)}
            className="mb-4 text-sm underline text-accent"
          >
            Close Filters
          </button>
          <button
            onClick={handleClearFilters}
            className="mb-4 text-sm text-muted underline hover:text-accent"
          >
            Clear Filters
          </button>

          {renderSection('brand', uniqueBrands)}
          {renderSection('type', uniqueTypes)}
          {renderSection('stability', uniqueStabilities)}
          {renderSection('speed', uniqueSpeeds)}
        </aside>
      </>
    );
  }

  // --- Desktop version ---
  return (
    <aside className="md:col-span-1 space-y-4 pt-2 md:pt-8">
      <button
        onClick={handleClearFilters}
        className="text-sm text-muted underline hover:text-accent"
      >
        Clear Filters
      </button>

      <input
        type="text"
        placeholder="Search by name or brand"
        value={filter.search}
        onChange={(e) => setFilter((prev) => ({ ...prev, search: e.target.value }))}
        className="w-full border border-muted/30 bg-surface text-foreground px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
      />

      {renderSection('brand', uniqueBrands)}
      {renderSection('type', uniqueTypes)}
      {renderSection('stability', uniqueStabilities)}
      {renderSection('speed', uniqueSpeeds)}
    </aside>
  );
}
