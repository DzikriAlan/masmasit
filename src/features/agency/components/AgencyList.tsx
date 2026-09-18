'use client';

import Link from 'next/link';

import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { TONE_CHIP, TONE_TEXT, toneOf } from '@/shared/lib/tones';
import { LoadData } from '@/components/load-data';
import { useLang } from '@/components/language-provider';
import { Button } from '@/components/ui/button';

import { useAgencyControllers } from '@/features/agency/controllers/agencyControllers';

// REST.md Bagian 7: one listing, in-house and member agencies side by side
// (getAgency() already orders the in-house row first without labelling it
// specially in the query — the badge below is the only visual distinction,
// and it's informational, not a privileged placement).
export default function AgencyList() {
  const { t } = useLang();
  const { fetchAgency } = useAgencyControllers();

  const agencies = fetchAgency.data ?? [];
  const loading = fetchAgency.isPending;

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
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

        <LoadData
          hideIcon
          response={{
            isLoading: loading,
            isEmpty: agencies.length === 0,
            emptyTitle: t('No agencies approved yet.', 'Belum ada agency yang disetujui.'),
          }}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {agencies.map((agency) => (
              <Link
                key={agency.id}
                href={`/agency/${agency.slug}`}
                className="group flex h-full flex-col rounded-xl border border-border p-5 transition-colors hover:border-foreground/30 hover:bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg ${TONE_CHIP[toneOf('agency')]}`}>
                    {agency.logo_url ? (
                      <img src={agency.logo_url} alt={agency.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-sm font-semibold">{agency.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{agency.name}</p>
                    {agency.is_in_house && (
                      <span className={`text-xs font-medium ${TONE_TEXT[toneOf('agency')]}`}>
                        {t('MasmasIT in-house', 'In-house MasmasIT')}
                      </span>
                    )}
                  </div>
                </div>
                <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
                  {agency.description}
                </p>
              </Link>
            ))}
          </div>
        </LoadData>
      </div>
    </AppShell>
  );
}
