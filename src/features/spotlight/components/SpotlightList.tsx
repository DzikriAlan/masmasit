'use client';

import { useState } from 'react';
import { Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { TONE_TEXT, toneOf } from '@/shared/lib/tones';
import { LoadData } from '@/components/load-data';
import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { loginHref } from '@/shared/lib/utils';

import { useSpotlightControllers } from '@/features/spotlight/controllers/spotlightControllers';

// REST.md Bagian 2/9: "Showcase produk/jasa — data ditarik dari Builds
// (Community) + submission langsung dari Solo Builder & Agency", ranked by
// Hot Rank (here: like count — the same signal Builds already tracks).
export default function SpotlightList() {
  const { user } = useAuth();
  const { t } = useLang();
  const { fetchSpotlight, fetchSpotlightAgenciesOwned, storeSpotlight } = useSpotlightControllers(user?.id);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', link_url: '', as: 'solo_builder' as 'solo_builder' | 'agency', agency_id: '' });

  const items = fetchSpotlight.data ?? [];
  const ownedAgencies = fetchSpotlightAgenciesOwned.data ?? [];
  const loading = fetchSpotlight.isPending;

  const openComposer = () => {
    if (!user) { window.location.href = loginHref(); return; }
    setOpen((v) => !v);
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
    setForm({ title: '', description: '', link_url: '', as: 'solo_builder', agency_id: '' });
    setOpen(false);
    toast.success(t('Submitted to Spotlight', 'Dikirim ke Spotlight'));
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          tone={toneOf('spotlight')}
          title={t('Spotlight', 'Spotlight')}
          subtitle={t('What members ship, ranked by Hot Rank.', 'Yang dirilis member, diurut berdasarkan Hot Rank.')}
          action={
            <Button onClick={openComposer}>{t('Submit', 'Submit')}</Button>
          }
        />

        {open && (
          <Card className="glass mb-6">
            <CardContent className="space-y-3 p-6">
              <Select value={form.as} onValueChange={(v: 'solo_builder' | 'agency') => setForm((f) => ({ ...f, as: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="solo_builder">{t('As a solo builder', 'Sebagai Solo Builder')}</SelectItem>
                  <SelectItem value="agency">{t('As an agency', 'Sebagai Agency')}</SelectItem>
                </SelectContent>
              </Select>
              {form.as === 'agency' && (
                <Select value={form.agency_id} onValueChange={(v) => setForm((f) => ({ ...f, agency_id: v }))}>
                  <SelectTrigger><SelectValue placeholder={t('Select your agency', 'Pilih agency-mu')} /></SelectTrigger>
                  <SelectContent>
                    {ownedAgencies.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder={t('Product or service name', 'Nama produk atau jasa')} />
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder={t('What does it do?', 'Ini produk/jasa apa?')}
                className="min-h-[80px]"
              />
              <Input value={form.link_url} onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value }))} placeholder={t('Link (optional)', 'Tautan (opsional)')} />
              <Button onClick={submitSpotlight} disabled={storeSpotlight.isPending} className="gap-2">
                {storeSpotlight.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {t('Submit', 'Submit')}
              </Button>
            </CardContent>
          </Card>
        )}

        <LoadData
          hideIcon
          response={{
            isLoading: loading,
            isEmpty: items.length === 0,
            emptyTitle: t('Nothing on the shelf yet.', 'Belum ada yang tayang di etalase.'),
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, i) => (
              <div key={item.id} className="relative rounded-xl border border-border p-5">
                {i === 0 && (
                  <span className="absolute -top-2.5 right-4 rounded-full bg-orange-500 px-2.5 py-0.5 text-xs font-semibold text-white">
                    {t('Hot', 'Hot')}
                  </span>
                )}
                <div className={`text-xs font-medium ${TONE_TEXT[toneOf('spotlight')]}`}>
                  {item.source_type === 'agency' ? item.agencies?.name : (item.profiles?.full_name ?? t('Member', 'Member'))}
                </div>
                <p className="mt-2 font-semibold">{item.title}</p>
                <p className="mt-1.5 text-sm text-muted-foreground">{item.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">♥ {item.likes_count}</span>
                  {item.link_url && (
                    <a href={item.link_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
                      {t('Visit', 'Kunjungi')} <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </LoadData>
      </div>
    </AppShell>
  );
}
