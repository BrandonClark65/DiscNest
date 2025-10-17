// src/components/ui/progress.tsx
'use client';

type ProgressProps = {
  value: number;
  className?: string;
};

export function Progress({ value, className = '' }: ProgressProps) {
  const percent = Math.min(Math.max(value, 0), 100);

  return (
    <div className={`w-full bg-gray-200 rounded-full h-3 ${className}`}>
      <div
        className="h-3 rounded-full bg-green-500 transition-all duration-300"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
