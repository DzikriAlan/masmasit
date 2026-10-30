/** Rows per page on internal lists: 15 to start, in steps of 15. */
export const PAGE_SIZES = [15, 30, 45, 60] as const;
export const DEFAULT_PAGE_SIZE = PAGE_SIZES[0];

/** One page of a list, and where it sits in the whole. */
export interface Page<T> {
  items: T[];
  /** 1-based, clamped into range — a filter that shrinks the list never
   *  leaves the reader stranded on a page that no longer exists. */
  page: number;
  pageCount: number;
  /** 1-based positions of the first and last item shown; 0 when empty. */
  from: number;
  to: number;
}

export function paginate<T>(items: T[], page: number, size: number): Page<T> {
  const pageCount = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(Math.max(1, Math.floor(page)), pageCount);
  const start = (current - 1) * size;
  const shown = items.slice(start, start + size);
  return {
    items: shown,
    page: current,
    pageCount,
    from: shown.length === 0 ? 0 : start + 1,
    to: start + shown.length,
  };
}
