'use client';

import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import type { DataSpotlight } from '@/features/spotlight/types/spotlightTypes';
import { useSpotlightControllers } from '@/features/spotlight/controllers/spotlightControllers';
import { SpotlightCard } from '@/features/spotlight/components/SpotlightCard';

import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { LoadData } from '@/components/load-data';
import { CardGridSkeleton } from '@/components/card-skeleton';
import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { signedOutState } from '@/shared/lib/browse-gate';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toneOf } from '@/shared/lib/tones';
import { loginHref } from '@/shared/lib/utils';

type SourceType = 'solo_builder' | 'agency';

const EMPTY_FORM = { title: '', description: '', link_url: '', as: 'solo_builder' as SourceType, agency_id: '' };

// REST.md Bagian 2/9: "Showcase produk/jasa — data ditarik dari Builds
// (Community) + submission langsung dari Solo Builder & Agency", ranked by
// Hot Rank (here: like count — the same signal Builds already tracks).
export default function SpotlightList() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLang();
  const { fetchSpotlight, fetchSpotlightAgenciesOwned, storeSpotlight } = useSpotlightControllers(user?.id);

  const [filters, setFilters] = useState({ isComposerOpen: false });
  const [form, setForm] = useState(EMPTY_FORM);

  const data = useMemo(() => {
    const getSourceLabel = (item: DataSpotlight) => {
      const labels: Record<DataSpotlight['source_type'], string> = {
        agency: t('Agency', 'Agency'),
        solo_builder: t('Solo builder', 'Solo Builder'),
        build: t('From Builds', 'Dari Builds'),
      };
      return labels[item.source_type] ?? t('Member', 'Member');
    };

    const getMaker = (item: DataSpotlight) =>
      item.source_type === 'agency'
        ? item.agencies?.name ?? t('An agency', 'Sebuah agency')
        : item.profiles?.full_name ?? t('A member', 'Seorang member');

    const getMappedItem = (item: DataSpotlight, index: number) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      maker: getMaker(item),
      sourceLabel: getSourceLabel(item),
      likes: item.likes_count,
      linkUrl: item.link_url,
      isHot: index === 0 && item.likes_count > 0,
    });

    const list = (fetchSpotlight.data ?? []).map(getMappedItem);

    return {
      data: list,
      isLoading: fetchSpotlight.isPending,
      isError: fetchSpotlight.isError,
      ...signedOutState(!authLoading && !user, t, t('Spotlight', 'Spotlight')),
      isEmpty: !fetchSpotlight.isPending && !fetchSpotlight.isError && list.length === 0,
      errorTitle: t('Could not load Spotlight.', 'Gagal memuat Spotlight.'),
      errorSubtitle: t('Check your connection and try again.', 'Periksa koneksi lalu coba lagi.'),
      emptyTitle: t('Nothing on the shelf yet.', 'Belum ada yang tayang di etalase.'),
      emptySubtitle: t('Shipped something? Submit it and start the ranking.', 'Baru rilis sesuatu? Submit dan mulai peringkatnya.'),
    };
  }, [fetchSpotlight.data, fetchSpotlight.isPending, fetchSpotlight.isError, t, user, authLoading]);

  const ownedAgencies = fetchSpotlightAgenciesOwned.data ?? [];

  const editSpotlightComposer = () => {
    if (!user) {
      window.location.href = loginHref();
      return;
    }
    setFilters((prev) => ({ ...prev, isComposerOpen: !prev.isComposerOpen }));
  };

  const editSpotlightForm = (patch: Partial<typeof EMPTY_FORM>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const clearSpotlightForm = () => {
    setForm(EMPTY_FORM);
    setFilters((prev) => ({ ...prev, isComposerOpen: false }));
  };

  const submitSpotlight = async () => {
    if (!user) return;

    if (!form.title.trim() || !form.description.trim()) {
      toast.error(t('Please fill in a title and description', 'Isi judul dan deskripsi'));
      return;
    }
    if (form.as === 'agency' && !form.agency_id) {
      toast.error(t('Select which agency this is for', 'Pilih agency untuk submission ini'));
      return;
    }

    try {
      await storeSpotlight.mutateAsync({
        user_id: user.id,
        title: form.title,
        description: form.description,
        link_url: form.link_url || null,
        source_type: form.as,
        agency_id: form.as === 'agency' ? form.agency_id : null,
      });
    } catch {
      toast.error(t('Failed to submit', 'Gagal mengirim'));
      return;
    }

    toast.success(t('Submitted to Spotlight', 'Dikirim ke Spotlight'));
    clearSpotlightForm();
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow={t('Product · Showcase', 'Product · Etalase')}
          tone={toneOf('spotlight')}
          title={t('Spotlight', 'Spotlight')}
          subtitle={t(
            'Products and services members actually shipped, ranked by Hot Rank.',
            'Produk dan jasa yang benar-benar dirilis member, diurut berdasarkan Hot Rank.'
          )}
          action={
            <Button onClick={editSpotlightComposer}>
              {filters.isComposerOpen ? t('Close', 'Tutup') : t('Submit yours', 'Submit punyamu')}
            </Button>
          }
        />

        {filters.isComposerOpen && (
          <Card className="mb-8 border-dashed">
            <CardHeader>
              <CardTitle className="font-display text-xl">{t('Submit to Spotlight', 'Submit ke Spotlight')}</CardTitle>
              <CardDescription>
                {t('Tell members what you built and where to find it.', 'Ceritakan apa yang kamu bangun dan di mana menemukannya.')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="spotlight-as">{t('Submitting as', 'Submit sebagai')}</Label>
                  <Select value={form.as} onValueChange={(value: SourceType) => editSpotlightForm({ as: value })}>
                    <SelectTrigger id="spotlight-as"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solo_builder">{t('A solo builder', 'Solo Builder')}</SelectItem>
                      <SelectItem value="agency">{t('An agency', 'Agency')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {form.as === 'agency' && (
                  <div className="space-y-2">
                    <Label htmlFor="spotlight-agency">{t('Agency', 'Agency')}</Label>
                    <Select value={form.agency_id} onValueChange={(value) => editSpotlightForm({ agency_id: value })}>
                      <SelectTrigger id="spotlight-agency">
                        <SelectValue placeholder={t('Select your agency', 'Pilih agency-mu')} />
                      </SelectTrigger>
                      <SelectContent>
                        {ownedAgencies.map((agency) => (
                          <SelectItem key={agency.id} value={agency.id}>{agency.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="spotlight-title">{t('Product or service name', 'Nama produk atau jasa')}</Label>
                <Input
                  id="spotlight-title"
                  value={form.title}
                  onChange={(event) => editSpotlightForm({ title: event.target.value })}
                  placeholder={t('e.g. Warung POS', 'mis. Warung POS')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="spotlight-description">{t('What does it do?', 'Ini produk/jasa apa?')}</Label>
                <Textarea
                  id="spotlight-description"
                  value={form.description}
                  onChange={(event) => editSpotlightForm({ description: event.target.value })}
                  placeholder={t('One or two sentences a stranger would understand.', 'Satu dua kalimat yang dimengerti orang awam.')}
                  className="min-h-[96px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="spotlight-link">{t('Link (optional)', 'Tautan (opsional)')}</Label>
                <Input
                  id="spotlight-link"
                  value={form.link_url}
                  onChange={(event) => editSpotlightForm({ link_url: event.target.value })}
                  placeholder="https://"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
                <Button onClick={submitSpotlight} disabled={storeSpotlight.isPending} className="gap-2">
                  {storeSpotlight.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t('Submit', 'Submit')}
                </Button>
                <Button variant="ghost" onClick={clearSpotlightForm}>{t('Cancel', 'Batal')}</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <LoadData hideIcon customLoader response={data}>
          {data.isLoading ? (
            <CardGridSkeleton count={6} chips={1} lines={3} />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data.data.map((item) => (
                <SpotlightCard
                  key={item.id}
                  item={item}
                  hotLabel={t('Hot', 'Hot')}
                  visitLabel={t('Visit', 'Kunjungi')}
                />
              ))}
            </div>
          )}
        </LoadData>
      </div>
    </AppShell>
  );
}
