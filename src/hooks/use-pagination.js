import { useState, useEffect } from 'react';

// Bookkeeping only (page/pageSize/counts) — callers decide how to use it.
// For client-side tables backed by DataTable, pass page/pageSize straight
// through to DataTable's own page/pageSize props so slicing happens *after*
// its internal column sort. For server-side pagination, use page/pageSize to
// compute an offset for the API call instead.
export function usePagination(totalItems, defaultPageSize, resetSignal) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // Any time the underlying set changes shape (new filter/search/sort target,
  // or a resize of the page), snap back to page 1 instead of risking landing
  // on a now out-of-range page.
  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line
  }, [totalItems, pageSize, resetSignal]);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const start = (clampedPage - 1) * pageSize;
  const rangeLabel = totalItems ? `${start + 1}–${Math.min(start + pageSize, totalItems)} de ${totalItems}` : null;

  return {
    page: clampedPage,
    pageSize,
    setPage,
    setPageSize,
    totalPages,
    hasPrev: clampedPage > 1,
    hasNext: clampedPage < totalPages,
    rangeLabel,
  };
}
