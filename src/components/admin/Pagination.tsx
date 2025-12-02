'use client';

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
};

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const visiblePages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2));

  return (
    <div className={`flex justify-center items-center gap-3 flex-wrap mt-4 ${className}`}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`px-3 py-1 rounded border transition ${
          currentPage === 1
            ? 'text-gray-400 border-gray-300 cursor-not-allowed'
            : 'hover:bg-gray-100 border-gray-400'
        }`}
      >
        Prev
      </button>

      {visiblePages.map((num) => (
        <button
          key={num}
          onClick={() => onPageChange(num)}
          className={`px-3 py-1 rounded border transition ${
            currentPage === num
              ? 'bg-blue-600 text-white border-blue-600'
              : 'hover:bg-gray-100 border-gray-400'
          }`}
        >
          {num}
        </button>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`px-3 py-1 rounded border transition ${
          currentPage === totalPages
            ? 'text-gray-400 border-gray-300 cursor-not-allowed'
            : 'hover:bg-gray-100 border-gray-400'
        }`}
      >
        Next
      </button>
    </div>
  );
}
