export function parsePagination(query, { defaultLimit = 10, maxLimit = 50 } = {}) {
  let page = Number.parseInt(query.page, 10);
  if (!Number.isFinite(page) || page < 1) page = 1;

  let limit = Number.parseInt(query.limit, 10);
  if (!Number.isFinite(limit) || limit < 1) limit = defaultLimit;
  limit = Math.min(limit, maxLimit);

  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function buildPagination({ page, limit, total }) {
  const totalPages = Math.max(1, Math.ceil(total / limit) || 1);
  const currentPage = Math.min(Math.max(1, page), totalPages);
  return {
    page: currentPage,
    limit,
    total,
    totalPages,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  };
}

/** Prefer this when computing skip so out-of-range pages don't return empty arrays. */
export function resolveSkip({ page, limit, total }) {
  const { page: currentPage } = buildPagination({ page, limit, total });
  return (currentPage - 1) * limit;
}
