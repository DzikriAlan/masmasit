'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Building2 } from 'lucide-react';
import { toast } from 'sonner';

import { AppShell } from '@/components/app-shell';
import { PageDecor } from '@/components/page-decor';
import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { loginHref } from '@/shared/lib/utils';

import { useAgencyRegisterControllers } from '@/features/agency/controllers/agencyControllers';

// REST.md Bagian 7: "Pendaftaran agency lewat dashboard user → approval
// admin (pola sama seperti approval company)." — reachable from the
// dashboard's own nav, and also linked directly from /agency for anyone
// who lands there first.
export default function AgencyRegisterForm() {
  const { user, loading } = useAuth();
  const { t } = useLang();
  const router = useRouter();
  const { storeAgency } = useAgencyRegisterControllers();

  const [form, setForm] = useState({ name: '', logo_url: '', description: '' });

  useEffect(() => {
    if (!loading && !user) router.push(loginHref());
  }, [loading, user, router]);

  const updateForm = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const submitAgency = async () => {
    if (!user) return;
    if (!form.name.trim() || !form.description.trim()) {
      toast.error(t('Please fill in the agency name and description', 'Isi nama dan deskripsi agency'));
      return;
    }
    try {
      const created = await storeAgency.mutateAsync({ owner_id: user.id, ...form });
      toast.success(t('Agency submitted — pending admin approval', 'Agency dikirim — menunggu approval admin'));
      router.push(created ? `/agency/${created.slug}` : '/agency');
    } catch {
      toast.error(t('Failed to register agency', 'Gagal mendaftarkan agency'));
    }
  };

  if (loading || !user) {
    return (
      <AppShell>
        <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageDecor>
        <div className="mx-auto max-w-lg px-4 py-12 sm:px-6 sm:py-16">
          <Card className="glass">
            <CardHeader>
              <div className="mb-2 flex items-center gap-2 text-primary">
                <Building2 className="h-5 w-5" />
              </div>
              <CardTitle className="font-display">{t('Register an Agency', 'Daftarkan Agency')}</CardTitle>
              <CardDescription>
                {t(
                  'Submitted for admin approval — the same queue used for company accounts.',
                  'Dikirim untuk approval admin — antrean yang sama dengan akun company.'
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="agency_name">{t('Agency Name', 'Nama Agency')}</Label>
                <Input id="agency_name" value={form.name} onChange={(e) => updateForm('name', e.target.value)} placeholder="Studio Kirana" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agency_logo">{t('Logo URL (optional)', 'URL Logo (opsional)')}</Label>
                <Input id="agency_logo" value={form.logo_url} onChange={(e) => updateForm('logo_url', e.target.value)} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agency_desc">{t('Description', 'Deskripsi')}</Label>
                <Textarea
                  id="agency_desc"
                  value={form.description}
                  onChange={(e) => updateForm('description', e.target.value)}
                  placeholder={t('What does the agency build, and for whom?', 'Agency ini membangun apa, untuk siapa?')}
                />
              </div>
              <Button onClick={submitAgency} className="w-full" disabled={storeAgency.isPending}>
                {storeAgency.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('Submit for approval', 'Kirim untuk approval')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </PageDecor>
    </AppShell>
  );
}
