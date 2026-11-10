function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.totalPages <= 1) return null;

  const { page, totalPages, total, hasPrev, hasNext } = pagination;

  return (
    <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-3">
      <p className="text-sm text-gray-500">
        Page {page} of {totalPages} · {total} total
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrev}
          className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNext}
          className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Pagination;
