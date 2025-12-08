'use client';

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
      <label className="text-sm font-semibold text-[var(--foreground)]/90">{label}</label>

      <select
        multiple
        value={value}
        onChange={handleSelectChange}
        className="
          h-32 rounded-lg border border-[var(--muted)]/40
          bg-[var(--surface)] text-[var(--foreground)]
          px-3 py-2 text-sm shadow-sm
          focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40
          transition-colors duration-200
        "
      >
        {options.map((option) => (
          <option
            key={option}
            value={option}
            className="py-1 bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--accent)]/10"
          >
            {option}
          </option>
        ))}
      </select>

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
                  transition-colors
                "
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
