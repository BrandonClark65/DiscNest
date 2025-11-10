'use client';

type Props = {
  totalPages: number;
  currentPage: number;
  onChange: (p: number) => void;
};

export default function CatalogPagination({ totalPages, currentPage, onChange }: Props) {
  const pages: (number | string)[] = [];
  const windowSize = 2;

  pages.push(1);
  if (currentPage - windowSize > 2) pages.push('...');
  for (let i = Math.max(2, currentPage - windowSize); i <= Math.min(totalPages - 1, currentPage + windowSize); i++) {
    pages.push(i);
  }
  if (currentPage + windowSize < totalPages - 1) pages.push('...');
  if (totalPages > 1) pages.push(totalPages);

  return (
    <div className="flex justify-center items-center gap-1 mt-8 flex-wrap">
      <button
        onClick={() => onChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1 border border-muted/30 rounded bg-surface hover:bg-muted/20 disabled:opacity-50"
      >
        Prev
      </button>
      {pages.map((page, idx) =>
        typeof page === 'number' ? (
          <button
            key={idx}
            onClick={() => onChange(page)}
            className={`px-3 py-1 border border-muted/30 rounded transition-all ${
              page === currentPage
                ? 'bg-gradient-brand text-white'
                : 'bg-surface hover:bg-muted/20 text-foreground'
            }`}
          >
            {page}
          </button>
        ) : (
          <span key={idx} className="px-2 text-muted">
            {page}
          </span>
        )
      )}
      <button
        onClick={() => onChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1 border border-muted/30 rounded bg-surface hover:bg-muted/20 disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}
