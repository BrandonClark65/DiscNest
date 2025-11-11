'use client';

type Props = {
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
};

export default function MarketplacePagination({
  totalPages,
  currentPage,
  onPageChange,
}: Props) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center mt-10 gap-2 flex-wrap">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            currentPage === page
              ? 'bg-[var(--primary)] text-[var(--background)] shadow-sm'
              : 'bg-[var(--surface)] text-foreground/70 hover:bg-[var(--muted)]/20'
          }`}
        >
          {page}
        </button>
      ))}
    </div>
  );
}
