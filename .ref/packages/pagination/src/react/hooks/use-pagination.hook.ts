/**
 * @file use-pagination.hook.ts
 * @module @stackra/ts-pagination/react/hooks
 * @description React hook for managing pagination state.
 *   Provides page/perPage state and navigation helpers for building
 *   paginated UI components.
 */

import { useState, useCallback, useMemo } from 'react';

// ════════════════════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════════
// Hook
// ════════════════════════════════════════════════════════════════════════════════

/**
 * React hook for managing pagination state.
 *
 * Provides reactive page and perPage state with navigation helpers.
 * Integrates with API calls by providing the computed offset and
 * navigation bounds.
 *
 * @param options - Optional initial configuration
 * @returns Pagination state and navigation functions
 *
 * @example
 * ```typescript
 * const { page, perPage, nextPage, previousPage, offset } = usePagination({
 *   initialPage: 1,
 *   initialPerPage: 25,
 *   total: 100,
 * });
 *
 * // Use offset for API calls
 * const { data } = useQuery(['users', page, perPage], () =>
 *   fetchUsers({ limit: perPage, offset })
 * );
 * ```
 */
export function usePagination(options: IUsePaginationOptions = {}): IUsePaginationReturn {
  const { initialPage = 1, initialPerPage = 15, total: initialTotal } = options;

  const [page, setPage] = useState(Math.max(1, initialPage));
  const [perPage, setPerPageState] = useState(Math.max(1, initialPerPage));
  const [total, setTotal] = useState<number | undefined>(initialTotal);

  const lastPage = useMemo(() => {
    if (total === undefined) return undefined;
    return Math.max(1, Math.ceil(total / perPage));
  }, [total, perPage]);

  const isFirstPage = page <= 1;
  const isLastPage = lastPage !== undefined ? page >= lastPage : false;
  const offset = (page - 1) * perPage;

  const goToPage = useCallback(
    (target: number) => {
      const clamped = Math.max(1, lastPage !== undefined ? Math.min(target, lastPage) : target);
      setPage(clamped);
    },
    [lastPage]
  );

  const nextPage = useCallback(() => {
    if (!isLastPage) {
      setPage((prev) => prev + 1);
    }
  }, [isLastPage]);

  const previousPage = useCallback(() => {
    if (!isFirstPage) {
      setPage((prev) => prev - 1);
    }
  }, [isFirstPage]);

  const firstPage = useCallback(() => {
    setPage(1);
  }, []);

  const lastPageNav = useCallback(() => {
    if (lastPage !== undefined) {
      setPage(lastPage);
    }
  }, [lastPage]);

  const setPerPage = useCallback((newPerPage: number) => {
    setPerPageState(Math.max(1, newPerPage));
    setPage(1);
  }, []);

  return {
    page,
    perPage,
    total,
    lastPage,
    isFirstPage,
    isLastPage,
    offset,
    goToPage,
    nextPage,
    previousPage,
    firstPage,
    lastPageNav,
    setPerPage,
    setTotal,
  };
}
