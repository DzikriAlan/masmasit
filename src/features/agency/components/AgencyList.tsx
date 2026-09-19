'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, BadgeCheck } from 'lucide-react';

import type { DataAgency } from '@/features/agency/types/agencyTypes';
import { useAgencyControllers } from '@/features/agency/controllers/agencyControllers';

import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { LoadData } from '@/components/load-data';
import { BrowseToolbar } from '@/components/browse-toolbar';
import { CardGridSkeleton } from '@/components/card-skeleton';
import { useLang } from '@/components/language-provider';
import { Button } from '@/components/ui/button';
import { TONE_CHIP, TONE_TEXT, toneOf } from '@/shared/lib/tones';
import { cn } from '@/shared/lib/utils';

// REST.md Bagian 7: one listing, in-house and member agencies side by side
// (getAgency() already orders the in-house row first without labelling it
// specially in the query — the badge below is the only visual distinction,
// and it's informational, not a privileged placement).
export default function AgencyList() {
  const { t } = useLang();
  const { fetchAgency } = useAgencyControllers();

  const [filters, setFilters] = useState({ search: '' });

  const data = useMemo(() => {
    const getMappedAgency = (agency: DataAgency) => ({
      id: agency.id,
      slug: agency.slug,
      name: agency.name,
      description: agency.description,
      logoUrl: agency.logo_url,
      initial: agency.name.charAt(0).toUpperCase(),
      isInHouse: agency.is_in_house,
    });

    const getMatchesSearch = (agency: ReturnType<typeof getMappedAgency>) => {
      const query = filters.search.trim().toLowerCase();
      if (!query) return true;
      return agency.name.toLowerCase().includes(query) || agency.description.toLowerCase().includes(query);
    };

    const list = (fetchAgency.data ?? []).map(getMappedAgency).filter(getMatchesSearch);
    const isFiltered = Boolean(filters.search.trim());

    return {
      data: list,
      isLoading: fetchAgency.isPending,
      isError: fetchAgency.isError,
      isEmpty: !fetchAgency.isPending && !fetchAgency.isError && list.length === 0,
      errorTitle: t('Could not load agencies.', 'Gagal memuat agency.'),
      errorSubtitle: t('Check your connection and try again.', 'Periksa koneksi lalu coba lagi.'),
      emptyTitle: isFiltered
        ? t('No agencies match that search.', 'Tidak ada agency yang cocok.')
        : t('No agencies approved yet.', 'Belum ada agency yang disetujui.'),
      emptySubtitle: isFiltered
        ? t('Try a different name or specialism.', 'Coba nama atau spesialisasi lain.')
        : t('Register yours — approval is manual and usually quick.', 'Daftarkan milikmu — persetujuan manual dan biasanya cepat.'),
    };
  }, [fetchAgency.data, fetchAgency.isPending, fetchAgency.isError, filters.search, t]);

  const editAgencySearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  };

  const clearAgencyFilters = () => {
    setFilters({ search: '' });
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow={t('Ecosystem · Business', 'Ekosistem · Bisnis')}
          tone={toneOf('agency')}
          title={t('Agencies', 'Agency')}
          subtitle={t(
            'Every approved agency listed on equal footing — the MasmasIT in-house team included.',
            'Setiap agency yang disetujui terdaftar setara — termasuk tim in-house MasmasIT.'
          )}
          action={
            <Link href="/agency/register">
              <Button variant="outline">{t('Register an agency', 'Daftarkan agency')}</Button>
            </Link>
          }
        />

        <BrowseToolbar
          searchValue={filters.search}
          searchPlaceholder={t('Search agencies…', 'Cari agency…')}
          onEditSearch={editAgencySearch}
          onClearFilters={clearAgencyFilters}
        />

        <LoadData hideIcon customLoader response={data}>
          {data.isLoading ? (
            <CardGridSkeleton count={6} chips={0} lines={3} />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data.data.map((agency) => (
                <Link
                  key={agency.id}
                  href={`/agency/${agency.slug}`}
                  className="group flex h-full min-w-0 flex-col rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-foreground/25 hover:shadow-[var(--shadow-card-hover)]"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg', TONE_CHIP[toneOf('agency')])}>
                      {agency.logoUrl ? (
                        <img src={agency.logoUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="font-semibold">{agency.initial}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold group-hover:underline">{agency.name}</p>
                      {agency.isInHouse && (
                        <span className={cn('mt-0.5 flex items-center gap-1 text-xs font-medium', TONE_TEXT[toneOf('agency')])}>
                          <BadgeCheck className="h-3.5 w-3.5" />
                          {t('MasmasIT in-house', 'In-house MasmasIT')}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground text-pretty">
                    {agency.description}
                  </p>

                  <span className="mt-auto flex items-center gap-1 pt-4 text-sm font-medium text-foreground group-hover:underline">
                    {t('View catalogue', 'Lihat katalog')}
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </LoadData>
      </div>
    </AppShell>
  );
}
