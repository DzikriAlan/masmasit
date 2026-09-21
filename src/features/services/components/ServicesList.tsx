'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import type { DataServices } from '@/features/services/types/servicesTypes';
import { useServicesControllers } from '@/features/services/controllers/servicesControllers';

import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { LoadData } from '@/components/load-data';
import { BrowseToolbar } from '@/components/browse-toolbar';
import { CardGridSkeleton } from '@/components/card-skeleton';
import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { signedOutState } from '@/shared/lib/browse-gate';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TONE_CHIP, TONE_TEXT, toneOf } from '@/shared/lib/tones';
import { cn } from '@/shared/lib/utils';

const EMPTY_FORM = { client_name: '', client_email: '', client_company: '', scope: '', budget: '' };

export default function ServicesList() {
  const { t } = useLang();
  const { user, loading: authLoading } = useAuth();
  const { fetchServices, storeServicesRequest } = useServicesControllers();

  const [filters, setFilters] = useState({
    search: '',
    filter: { category: 'all' },
    selectedServiceId: null as string | null,
    isSubmitted: false,
  });
  const [form, setForm] = useState(EMPTY_FORM);

  const data = useMemo(() => {
    const getPriceLabel = (price: number | null) =>
      price ? `${t('From', 'Mulai')} Rp ${(price / 1000000).toFixed(0)} jt` : t('Quoted per project', 'Penawaran per proyek');

    const getMappedService = (service: DataServices) => ({
      id: service.id,
      title: service.title,
      description: service.description,
      category: service.category,
      priceLabel: getPriceLabel(service.base_price),
    });

    const getMatchesFilters = (service: ReturnType<typeof getMappedService>) => {
      const query = filters.search.trim().toLowerCase();
      if (query && !service.title.toLowerCase().includes(query) && !service.description.toLowerCase().includes(query)) return false;
      if (filters.filter.category !== 'all' && service.category !== filters.filter.category) return false;
      return true;
    };

    const all = (fetchServices.data ?? []).map(getMappedService);
    const list = all.filter(getMatchesFilters);
    const isFiltered = Boolean(filters.search) || filters.filter.category !== 'all';

    return {
      data: list,
      categories: Array.from(new Set(all.map((service) => service.category))).sort((a, b) => a.localeCompare(b)),
      selected: all.find((service) => service.id === filters.selectedServiceId) ?? null,
      isLoading: fetchServices.isPending,
      isError: fetchServices.isError,
      ...signedOutState(!authLoading && !user, t, t('services', 'layanan')),
      isEmpty: !fetchServices.isPending && !fetchServices.isError && list.length === 0,
      errorTitle: t('Could not load services.', 'Gagal memuat layanan.'),
      errorSubtitle: t('Check your connection and try again.', 'Periksa koneksi lalu coba lagi.'),
      emptyTitle: isFiltered
        ? t('No services match these filters.', 'Tidak ada layanan yang cocok.')
        : t('No services listed yet.', 'Belum ada layanan yang terdaftar.'),
      emptySubtitle: isFiltered
        ? t('Try another category, or a broader search.', 'Coba kategori lain, atau kata kunci yang lebih umum.')
        : t('The catalogue is being prepared.', 'Katalog sedang disiapkan.'),
    };
  }, [fetchServices.data, fetchServices.isPending, fetchServices.isError, filters, t, user, authLoading]);

  const toolbarFilters = useMemo(
    () => [
      {
        key: 'category',
        label: t('Category', 'Kategori'),
        value: filters.filter.category,
        width: 'sm:w-56',
        options: [
          { value: 'all', label: t('All categories', 'Semua kategori') },
          ...data.categories.map((category) => ({ value: category, label: category })),
        ],
      },
    ],
    [filters.filter.category, data.categories, t]
  );

  const isRequestIncomplete = !form.client_name.trim() || !form.client_email.trim() || !form.scope.trim();

  const editServicesSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  };

  const editServicesFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, filter: { ...prev.filter, [key]: value } }));
  };

  const clearServicesFilters = () => {
    setFilters((prev) => ({ ...prev, search: '', filter: { category: 'all' } }));
  };

  const editServicesRequest = (serviceId: string | null) => {
    setFilters((prev) => ({ ...prev, selectedServiceId: serviceId }));
  };

  const editServicesForm = (patch: Partial<typeof EMPTY_FORM>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const clearServicesSubmitted = () => {
    setFilters((prev) => ({ ...prev, isSubmitted: false }));
  };

  const submitServicesRequest = async () => {
    const getBudget = () => (form.budget ? Number.parseInt(form.budget, 10) : null);

    try {
      await storeServicesRequest.mutateAsync({
        client_name: form.client_name,
        client_email: form.client_email,
        client_company: form.client_company || null,
        service_id: filters.selectedServiceId,
        scope: form.scope,
        budget: getBudget(),
      });
    } catch {
      toast.error(t('Failed to submit request', 'Gagal mengirim permintaan'));
      return;
    }

    setForm(EMPTY_FORM);
    setFilters((prev) => ({ ...prev, selectedServiceId: null, isSubmitted: true }));
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow={t('Ecosystem · Business', 'Ekosistem · Bisnis')}
          tone={toneOf('services')}
          title={t('Services', 'Layanan')}
          subtitle={t(
            'End-to-end digital work delivered by the MasmasIT team — from MVP to enterprise scale.',
            'Pekerjaan digital end-to-end oleh tim MasmasIT — dari MVP hingga skala enterprise.'
          )}
        />

        <BrowseToolbar
          searchValue={filters.search}
          searchPlaceholder={t('Search services…', 'Cari layanan…')}
          onEditSearch={editServicesSearch}
          filters={toolbarFilters}
          onEditFilter={editServicesFilter}
          onClearFilters={clearServicesFilters}
        />

        <LoadData hideIcon customLoader response={data}>
          {data.isLoading ? (
            <CardGridSkeleton count={6} chips={1} lines={2} />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data.data.map((service) => (
                <div key={service.id} className="flex h-full min-w-0 flex-col rounded-xl border border-border bg-card p-5">
                  <Badge variant="outline" className={cn('w-fit text-[11px]', TONE_CHIP[toneOf('services')])}>
                    {service.category}
                  </Badge>
                  <h3 className="mt-3 font-semibold leading-snug">{service.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground text-pretty">
                    {service.description}
                  </p>

                  <div className="mt-auto space-y-3 pt-4">
                    <p className={cn('text-sm font-semibold', TONE_TEXT[toneOf('services')])}>{service.priceLabel}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => editServicesRequest(service.id)}
                    >
                      {t('Request project', 'Minta proyek')}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </LoadData>
      </div>

      <Dialog open={Boolean(filters.selectedServiceId)} onOpenChange={(open) => !open && editServicesRequest(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('Request a project', 'Minta proyek')}</DialogTitle>
            <DialogDescription>
              {data.selected
                ? t(`About: ${data.selected.title}`, `Tentang: ${data.selected.title}`)
                : t('Tell us your scope and we will come back to you.', 'Ceritakan scope-nya dan kami akan menghubungi Anda.')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="request-name">{t('Your name', 'Nama Anda')}</Label>
                <Input
                  id="request-name"
                  value={form.client_name}
                  onChange={(event) => editServicesForm({ client_name: event.target.value })}
                  placeholder="Budi Santoso"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="request-email">{t('Email', 'Email')}</Label>
                <Input
                  id="request-email"
                  type="email"
                  value={form.client_email}
                  onChange={(event) => editServicesForm({ client_email: event.target.value })}
                  placeholder="budi@perusahaan.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="request-company">{t('Company (optional)', 'Perusahaan (opsional)')}</Label>
              <Input
                id="request-company"
                value={form.client_company}
                onChange={(event) => editServicesForm({ client_company: event.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="request-scope">{t('Project scope', 'Scope proyek')}</Label>
              <Textarea
                id="request-scope"
                value={form.scope}
                onChange={(event) => editServicesForm({ scope: event.target.value })}
                placeholder={t('What needs building, and by when?', 'Apa yang perlu dibangun, dan kapan?')}
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="request-budget">{t('Budget (IDR, optional)', 'Budget (IDR, opsional)')}</Label>
              <Input
                id="request-budget"
                type="number"
                inputMode="numeric"
                value={form.budget}
                onChange={(event) => editServicesForm({ budget: event.target.value })}
                placeholder="50000000"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
              <Button
                onClick={submitServicesRequest}
                disabled={storeServicesRequest.isPending || isRequestIncomplete}
                className="gap-2"
              >
                {storeServicesRequest.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {t('Send request', 'Kirim permintaan')}
              </Button>
              <Button variant="ghost" onClick={() => editServicesRequest(null)}>{t('Cancel', 'Batal')}</Button>
              {isRequestIncomplete && (
                <p className="text-xs text-muted-foreground">
                  {t('Name, email and scope are required.', 'Nama, email, dan scope wajib diisi.')}
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={filters.isSubmitted} onOpenChange={(open) => !open && clearServicesSubmitted()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              {t('Request sent', 'Permintaan terkirim')}
            </DialogTitle>
            <DialogDescription>
              {t(
                'Our team reviews it and contacts you within 2 business days with a DP payment link via GoAkal.',
                'Tim kami meninjau dan menghubungi Anda dalam 2 hari kerja dengan link pembayaran DP via GoAkal.'
              )}
            </DialogDescription>
          </DialogHeader>
          <Button onClick={clearServicesSubmitted}>{t('Close', 'Tutup')}</Button>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
