'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { useLang } from '@/components/language-provider';
import { Button } from '@/components/ui/button';

interface Props {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

/** Prev / next pager shared by the paged admin lists. */
export default function AdminPager({ page, totalPages, total, onPageChange }: Props) {
  const { t } = useLang();

  if (total === 0) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
      <span>{t(`${total} total · page ${page} of ${totalPages}`, `${total} total · halaman ${page} dari ${totalPages}`)}</span>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="gap-1">
          <ChevronLeft className="h-3.5 w-3.5" /> {t('Prev', 'Sebelumnya')}
        </Button>
        <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className="gap-1">
          {t('Next', 'Berikutnya')} <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
