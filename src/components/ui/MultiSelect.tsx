'use client';

import { useState } from 'react';
import { DiscBrands, DiscPlasticsByBrand } from '@/app/constants/discData';

type MultiSelectProps = {
  label: string;
  options: string[];
  value: string[];
  onChange: (newValue: string[]) => void;
  groupedByBrand?: boolean; // If true, options should be plastics and will be grouped by brand
};

export default function MultiSelect({ label, options, value, onChange, groupedByBrand = false }: MultiSelectProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleToggle = (option: string) => {
    if (value.includes(option)) {
      onChange(value.filter((v) => v !== option));
    } else {
      onChange([...value, option]);
    }
  };

  const handleRemove = (item: string) => {
    onChange(value.filter((v) => v !== item));
  };

  // Filter options based on search term
  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Render grouped options if requested
  const renderGroupedOptions = () => {
    if (!groupedByBrand) return null;

    const brandGroups = DiscBrands.filter((brand) => {
      const brandPlastics = DiscPlasticsByBrand[brand];
      return brandPlastics && brandPlastics.length > 0;
    });

    const hasGroupings = brandGroups.length > 0;

    // Filter brand groups based on search term
    const filteredBrandGroups = brandGroups.filter((brand) => {
      const brandPlastics = DiscPlasticsByBrand[brand];
      return brandPlastics?.some((plastic) =>
        plastic.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

    // Fallback: if no brand groupings exist yet, show all options
    if (!hasGroupings) {
      return (
        <div className="space-y-1">
          {filteredOptions.map((option) => (
            <label
              key={option}
              className="
                flex items-center gap-2 px-3 py-2 rounded-md
                hover:bg-[var(--muted)]/30 cursor-pointer
                transition-colors duration-150
              "
            >
              <input
                type="checkbox"
                checked={value.includes(option)}
                onChange={() => handleToggle(option)}
                className="
                  w-4 h-4 rounded border-[var(--muted)]
                  text-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/40
                  cursor-pointer
                "
              />
              <span className="text-sm text-[var(--foreground)]">{option}</span>
            </label>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {filteredBrandGroups.map((brand) => {
          const brandPlastics = DiscPlasticsByBrand[brand];
          if (!brandPlastics || brandPlastics.length === 0) return null;

          const filteredPlastics = brandPlastics.filter((plastic) =>
            plastic.toLowerCase().includes(searchTerm.toLowerCase())
          );

          if (filteredPlastics.length === 0) return null;

          return (
            <div key={brand} className="space-y-1">
              <div className="text-xs font-semibold text-[var(--foreground)]/70 px-3 py-1 uppercase tracking-wide">
                {brand}
              </div>
              {filteredPlastics.map((plastic) => (
                <label
                  key={plastic}
                  className="
                    flex items-center gap-2 px-3 py-2 rounded-md ml-2
                    hover:bg-[var(--muted)]/30 cursor-pointer
                    transition-colors duration-150
                  "
                >
                  <input
                    type="checkbox"
                    checked={value.includes(plastic)}
                    onChange={() => handleToggle(plastic)}
                    className="
                      w-4 h-4 rounded border-[var(--muted)]
                      text-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/40
                      cursor-pointer
                    "
                  />
                  <span className="text-sm text-[var(--foreground)]">{plastic}</span>
                </label>
              ))}
            </div>
          );
        })}
        {options.includes('Unknown') && (
          <div className="space-y-1">
            <div className="text-xs font-semibold text-[var(--foreground)]/70 px-3 py-1 uppercase tracking-wide">
              Other
            </div>
            <label
              className="
                flex items-center gap-2 px-3 py-2 rounded-md ml-2
                hover:bg-[var(--muted)]/30 cursor-pointer
                transition-colors duration-150
              "
            >
              <input
                type="checkbox"
                checked={value.includes('Unknown')}
                onChange={() => handleToggle('Unknown')}
                className="
                  w-4 h-4 rounded border-[var(--muted)]
                  text-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/40
                  cursor-pointer
                "
              />
              <span className="text-sm text-[var(--foreground)]">Unknown</span>
            </label>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-[var(--foreground)]/90">{label}</label>

      {/* Search input */}
      <input
        type="text"
        placeholder="Search options..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="
          w-full px-3 py-2 rounded-lg border border-[var(--muted)]/40
          bg-[var(--surface)] text-[var(--foreground)]
          text-sm shadow-sm
          focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40
          transition-colors duration-200
        "
      />

      {/* Checkbox list */}
      <div
        className="
          h-48 overflow-y-auto rounded-lg border border-[var(--muted)]/40
          bg-[var(--surface)] p-2
          focus-within:ring-2 focus-within:ring-[var(--accent)]/40
        "
      >
        {groupedByBrand ? (
          renderGroupedOptions()
        ) : (
          <div className="space-y-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <label
                  key={option}
                  className="
                    flex items-center gap-2 px-3 py-2 rounded-md
                    hover:bg-[var(--muted)]/30 cursor-pointer
                    transition-colors duration-150
                  "
                >
                  <input
                    type="checkbox"
                    checked={value.includes(option)}
                    onChange={() => handleToggle(option)}
                    className="
                      w-4 h-4 rounded border-[var(--muted)]
                      text-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/40
                      cursor-pointer
                    "
                  />
                  <span className="text-sm text-[var(--foreground)]">{option}</span>
                </label>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-[var(--foreground)]/60">
                No options found
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected items as tags */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-1">
          {value.map((v) => (
            <span
              key={v}
              className="
                flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                bg-[color-mix(in srgb, var(--accent) 25%, transparent)]
                text-[var(--foreground)] shadow-sm
              "
            >
              {v}
              <button
                type="button"
                onClick={() => handleRemove(v)}
                className="
                  text-[var(--accent)] hover:text-[var(--accent)]/80
                  transition-colors ml-1
                "
                aria-label={`Remove ${v}`}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
