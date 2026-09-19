'use client';

import type { ReactNode } from 'react';
import { Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MobileFilterDrawer, MobileFilterField } from '@/components/mobile-filter-drawer';
import { useLang } from '@/components/language-provider';
import { cn } from '@/shared/lib/utils';

export interface BrowseFilterOption {
  value: string;
  label: string;
}

export interface BrowseFilter {
  key: string;
  label: string;
  value: string;
  /** The value that counts as "no filter applied" — defaults to `all`. */
  anyValue?: string;
  options: BrowseFilterOption[];
  /** Desktop-only trigger width, e.g. `sm:w-44`. */
  width?: string;
}

/**
 * One toolbar for every browse page: search always visible, the selects
 * inline from `sm` up and folded into the existing bottom-sheet below it.
 * Jobs, Directory, Events, Talents and Services each hand-rolled this same
 * block with slightly different spacing; this is the single version.
 */
export function BrowseToolbar({
  searchValue,
  searchPlaceholder,
  onEditSearch,
  filters = [],
  onEditFilter,
  onClearFilters,
  trailing,
}: Readonly<{
  searchValue: string;
  searchPlaceholder: string;
  onEditSearch: (value: string) => void;
  filters?: BrowseFilter[];
  onEditFilter?: (key: string, value: string) => void;
  onClearFilters?: () => void;
  trailing?: ReactNode;
}>) {
  const { t } = useLang();

  const activeCount = filters.filter((filter) => filter.value !== (filter.anyValue ?? 'all')).length;
  const hasActive = activeCount > 0 || searchValue.trim().length > 0;

  const renderSelect = (filter: BrowseFilter, className?: string) => (
    <Select key={filter.key} value={filter.value} onValueChange={(value) => onEditFilter?.(filter.key, value)}>
      <SelectTrigger className={className} aria-label={filter.label}>
        <SelectValue placeholder={filter.label} />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {filter.options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <div className="mb-8 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 basis-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(event) => onEditSearch(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="h-11 pl-9"
          />
        </div>

        {filters.map((filter) => renderSelect(filter, cn('hidden h-11 sm:flex', filter.width ?? 'sm:w-44')))}

        {trailing}
      </div>

      <div className="flex items-center gap-3">
        {filters.length > 0 && (
          <MobileFilterDrawer
            triggerLabel={t('Filter', 'Filter')}
            title={t('Filter your search', 'Filter pencarianmu')}
            applyLabel={t('Show results', 'Tampilkan hasil')}
            activeCount={activeCount}
          >
            {filters.map((filter) => (
              <MobileFilterField key={filter.key} label={filter.label}>
                {renderSelect(filter)}
              </MobileFilterField>
            ))}
          </MobileFilterDrawer>
        )}

        {hasActive && onClearFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="hidden h-8 gap-1.5 px-2 text-muted-foreground hover:text-foreground sm:inline-flex"
          >
            <X className="h-3.5 w-3.5" />
            {t('Clear filters', 'Hapus filter')}
          </Button>
        )}
      </div>
    </div>
  );
}
