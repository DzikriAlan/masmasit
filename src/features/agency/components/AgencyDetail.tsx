'use client';

import { useParams } from 'next/navigation';

import { AppShell } from '@/components/app-shell';
import { LoadData } from '@/components/load-data';
import { useLang } from '@/components/language-provider';
import { Button } from '@/components/ui/button';
import { waLink } from '@/shared/lib/external';
import { TONE_CHIP, TONE_TEXT, toneOf } from '@/shared/lib/tones';

import { useAgencyDetailControllers } from '@/features/agency/controllers/agencyControllers';

export default function AgencyDetail() {
  const params = useParams();
  const slug = String(params.slug ?? '');
  const { t } = useLang();
  const { fetchAgencyDetail } = useAgencyDetailControllers(slug);

  const agency = fetchAgencyDetail.data;
  const loading = fetchAgencyDetail.isPending;
  const services = (agency?.agency_services ?? []).filter((s) => s.is_active);

  return (
    <AppShell>
        <LoadData
          minHeight="60vh"
          className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8"
          hideIcon
          response={{
            isLoading: loading,
            isEmpty: !agency,
            emptyTitle: t('Agency not found', 'Agency tidak ditemukan'),
            emptySubtitle: t('It may not be approved yet, or the link is wrong.', 'Mungkin belum disetujui, atau tautannya salah.'),
          }}
        >
          {/* JSX children are constructed by this component's own render
              pass regardless of what LoadData decides to show, so `agency`
              must be null-checked here too — otherwise the very first
              render (while still loading) dereferences a null value before
              LoadData ever gets a chance to hide this block. */}
          {agency && (
          <>
          <div className="flex items-center gap-4">
            <div className={`flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl ${TONE_CHIP[toneOf('agency')]}`}>
              {agency.logo_url ? (
                <img src={agency.logo_url} alt={agency.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-lg font-semibold">{agency.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div>
              <h1 className={`font-display text-2xl font-semibold tracking-tight sm:text-3xl ${TONE_TEXT[toneOf('agency')]}`}>{agency.name}</h1>
              {agency.is_in_house && (
                <span className={`mt-1 inline-block text-xs font-medium ${TONE_TEXT[toneOf('agency')]}`}>
                  {t('MasmasIT in-house', 'In-house MasmasIT')}
                </span>
              )}
            </div>
          </div>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground text-pretty">
            {agency.description}
          </p>

          <section className="mt-12">
            <h2 className="eyebrow text-muted-foreground">{t('Service catalogue', 'Katalog jasa')}</h2>
            {services.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">{t('No services listed yet.', 'Belum ada layanan yang terdaftar.')}</p>
            ) : (
              <div className="mt-4 divide-y divide-border border-y border-border">
                {services.map((service) => (
                  <div key={service.id} className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{service.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{service.description}</p>
                      {service.base_price !== null && (
                        <p className="mt-1 text-sm font-medium text-foreground">
                          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(service.base_price)}
                        </p>
                      )}
                    </div>
                    <a
                      href={waLink(t(`Hi ${agency.name}, I'd like to discuss "${service.title}".`, `Halo ${agency.name}, saya ingin diskusi soal "${service.title}".`))}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0"
                    >
                      <Button variant="outline" size="sm" className={TONE_TEXT[toneOf('agency')]}>
                        {t('Discuss', 'Diskusi')}
                      </Button>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </section>
          </>
          )}
        </LoadData>
    </AppShell>
  );
}
