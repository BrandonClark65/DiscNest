'use client';

import { useState } from 'react';

type MultiSelectProps = {
  label: string;
  options: string[];
  value: string[];
  onChange: (newValue: string[]) => void;
};

export default function MultiSelect({ label, options, value, onChange }: MultiSelectProps) {
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
    onChange(selected);
  };

  const handleRemove = (item: string) => {
    onChange(value.filter((v) => v !== item));
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>

      <select
        multiple
        value={value}
        onChange={handleSelectChange}
        className="h-32 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
      >
        {options.map((option) => (
          <option key={option} value={option} className="py-1">
            {option}
          </option>
        ))}
      </select>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-1">
          {value.map((v) => (
            <span
              key={v}
              className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium"
            >
              {v}
              <button
                type="button"
                onClick={() => handleRemove(v)}
                className="text-blue-500 hover:text-blue-700"
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
