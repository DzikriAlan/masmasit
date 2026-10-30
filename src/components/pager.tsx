'use client';

import { useState } from 'react';

import { useLang } from '@/components/language-provider';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DEFAULT_PAGE_SIZE, PAGE_SIZES, paginate } from '@/shared/lib/paginate';
import { cn } from '@/shared/lib/utils';

export interface PagerProps {
  page: number;
  pageSize: number;
  /** Rows in the whole list, across every page, and how many pages that
   *  makes. A list paged on the server without a count gives
   *  `hasNextPage` instead. */
  total?: number;
  pageCount?: number;
  hasNextPage?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  className?: string;
}

/**
 * Pages a list held in memory, 15 rows to start. The page goes back to one
 * when the list's length changes — a new search or filter — so a reader is
 * never left on page four of a list that now has one.
 */
export function usePagination<T>(items: T[]) {
  const [state, setState] = useState({ page: 1, size: DEFAULT_PAGE_SIZE as number, length: items.length });
  const page = state.length === items.length ? state.page : 1;
  const paged = paginate(items, page, state.size);
  const pager: PagerProps = {
    page: paged.page,
    pageCount: paged.pageCount,
    total: items.length,
    pageSize: state.size,
    onPageChange: (next) => setState((s) => ({ ...s, page: next, length: items.length })),
    onPageSizeChange: (size) => setState({ page: 1, size, length: items.length }),
  };
  return { items: paged.items, pager };
}

/**
 * Pixel's pager: what is shown of how many, rows per page (15, 30, 45, 60),
 * and previous / next. Hidden while the whole list fits the smallest page.
 */
export function Pager({
  page,
  pageCount,
  total,
  hasNextPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  className,
}: Readonly<PagerProps>) {
  const { t } = useLang();
  const counted = total !== undefined;
  // Uncounted, the pager stays while a larger page is picked, so the reader
  // can always get back to 15.
  const hidden = counted ? total <= PAGE_SIZES[0] : page === 1 && !hasNextPage && pageSize === PAGE_SIZES[0];
  if (hidden) return null;

  const from = (page - 1) * pageSize + 1;
  const to = counted ? Math.min(page * pageSize, total) : 0;
  const isLast = counted ? page >= (pageCount ?? 1) : !hasNextPage;

  return (
    <nav
      aria-label={t('Pages', 'Halaman')}
      className={cn('mt-6 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground', className)}
    >
      <span className="tabular-nums">
        {counted && t(`Showing ${from}–${to} of ${total}`, `Menampilkan ${from}–${to} dari ${total}`)}
      </span>
      <div className="flex flex-wrap items-center gap-2">
        <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
          <SelectTrigger className="h-8 w-32" aria-label={t('Rows per page', 'Baris per halaman')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZES.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {t(`${size} / page`, `${size} / halaman`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          {t('Previous', 'Sebelumnya')}
        </Button>
        <span className="tabular-nums">
          {counted
            ? t(`Page ${page} of ${pageCount}`, `Halaman ${page} dari ${pageCount}`)
            : t(`Page ${page}`, `Halaman ${page}`)}
        </span>
        <Button variant="outline" size="sm" disabled={isLast} onClick={() => onPageChange(page + 1)}>
          {t('Next', 'Berikutnya')}
        </Button>
      </div>
    </nav>
  );
}
