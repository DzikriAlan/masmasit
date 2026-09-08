'use client';

import { useState } from 'react';
import { Loader2, Plus, Trash2, Package, TrendingUp, Power } from 'lucide-react';
import { toast } from 'sonner';

import { useLang } from '@/components/language-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { useAdminCatalogControllers } from '@/features/admin/controllers/adminControllers';

const CATEGORIES = ['SaaS', 'AI Solutions', 'Creative Services', 'HR Solutions'];

const EMPTY_SERVICE = { title: '', description: '', category: 'SaaS', base_price: '' };
const EMPTY_CASE = { title: '', client_name: '', challenge: '', solution: '', result: '', category: '', image_url: '' };

interface Props {
  enabled: boolean;
}

export default function AdminCatalog({ enabled }: Props) {
  const { t } = useLang();
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [serviceForm, setServiceForm] = useState(EMPTY_SERVICE);
  const [showCaseForm, setShowCaseForm] = useState(false);
  const [caseForm, setCaseForm] = useState(EMPTY_CASE);

  const {
    fetchAdminAgencyServices,
    storeAdminAgencyService,
    changeAdminAgencyService,
    removeAdminAgencyService,
    fetchAdminCaseStudies,
    storeAdminCaseStudy,
    removeAdminCaseStudy,
  } = useAdminCatalogControllers(enabled);

  const services = fetchAdminAgencyServices.data ?? [];
  const caseStudies = fetchAdminCaseStudies.data ?? [];
  const savingService = storeAdminAgencyService.isPending || changeAdminAgencyService.isPending;
  const savingCase = storeAdminCaseStudy.isPending;

  const saveService = async () => {
    if (!serviceForm.title || !serviceForm.description) {
      toast.error(t('Title and description are required', 'Judul dan deskripsi wajib diisi'));
      return;
    }
    try {
      await storeAdminAgencyService.mutateAsync({
        ...serviceForm,
        base_price: serviceForm.base_price ? parseInt(serviceForm.base_price) : null,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('Failed to save service', 'Gagal menyimpan layanan'));
      return;
    }
    toast.success(t('Service created', 'Layanan dibuat'));
    setShowServiceForm(false);
    setServiceForm(EMPTY_SERVICE);
  };

  const modifyServiceActive = async (id: string, isActive: boolean) => {
    try {
      await changeAdminAgencyService.mutateAsync({ id, data: { is_active: !isActive } });
    } catch {
      toast.error(t('Failed to update service', 'Gagal memperbarui layanan'));
      return;
    }
    toast.success(t('Service updated', 'Layanan diperbarui'));
  };

  const destroyService = async (id: string) => {
    try {
      await removeAdminAgencyService.mutateAsync(id);
    } catch {
      toast.error(t('Failed to delete service', 'Gagal menghapus layanan'));
      return;
    }
    toast.success(t('Service deleted', 'Layanan dihapus'));
  };

  const saveCaseStudy = async () => {
    const required = [caseForm.title, caseForm.client_name, caseForm.challenge, caseForm.solution, caseForm.result];
    if (required.some((v) => !v)) {
      toast.error(t('Please fill all required fields', 'Mohon isi semua field wajib'));
      return;
    }
    try {
      await storeAdminCaseStudy.mutateAsync({
        ...caseForm,
        category: caseForm.category || null,
        image_url: caseForm.image_url || null,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('Failed to save case study', 'Gagal menyimpan studi kasus'));
      return;
    }
    toast.success(t('Case study created', 'Studi kasus dibuat'));
    setShowCaseForm(false);
    setCaseForm(EMPTY_CASE);
  };

  const destroyCaseStudy = async (id: string) => {
    try {
      await removeAdminCaseStudy.mutateAsync(id);
    } catch {
      toast.error(t('Failed to delete case study', 'Gagal menghapus studi kasus'));
      return;
    }
    toast.success(t('Case study deleted', 'Studi kasus dihapus'));
  };

  return (
    <div className="space-y-6">
      <Card className="glass">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>{t('Agency Services', 'Layanan Agency')}</CardTitle>
            <CardDescription>
              {t('The catalogue shown on the public /services page.', 'Katalog yang tampil di halaman publik /services.')}
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setShowServiceForm(!showServiceForm)} className="gap-1">
            <Plus className="h-3.5 w-3.5" /> {t('Add', 'Tambah')}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {showServiceForm && (
            <div className="grid gap-3 rounded-lg border border-border/60 p-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('Title', 'Judul')}</Label>
                <Input value={serviceForm.title} onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t('Category', 'Kategori')}</Label>
                <Select value={serviceForm.category} onValueChange={(v) => setServiceForm({ ...serviceForm, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t('Description', 'Deskripsi')}</Label>
                <Textarea value={serviceForm.description} onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t('Base Price (Rp)', 'Harga Dasar (Rp)')}</Label>
                <Input type="number" value={serviceForm.base_price} onChange={(e) => setServiceForm({ ...serviceForm, base_price: e.target.value })} />
              </div>
              <div className="flex items-end">
                <Button onClick={saveService} disabled={savingService} className="w-full gap-2">
                  {savingService && <Loader2 className="h-4 w-4 animate-spin" />} {t('Save', 'Simpan')}
                </Button>
              </div>
            </div>
          )}

          {services.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              <Package className="mx-auto mb-2 h-8 w-8 opacity-50" />
              {t('No services yet.', 'Belum ada layanan.')}
            </p>
          ) : (
            services.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border/60 p-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{s.title}</p>
                    <Badge variant="secondary" className="text-xs">{s.category}</Badge>
                    {!s.is_active && <Badge variant="outline" className="text-xs">{t('Inactive', 'Nonaktif')}</Badge>}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{s.description}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => modifyServiceActive(s.id, s.is_active)} className="gap-1">
                  <Power className="h-3.5 w-3.5" /> {s.is_active ? t('Disable', 'Nonaktifkan') : t('Enable', 'Aktifkan')}
                </Button>
                <Button size="sm" variant="outline" onClick={() => destroyService(s.id)} className="gap-1">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>{t('Case Studies', 'Studi Kasus')}</CardTitle>
            <CardDescription>
              {t('Published on the public /case-studies page.', 'Dipublikasikan di halaman publik /case-studies.')}
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setShowCaseForm(!showCaseForm)} className="gap-1">
            <Plus className="h-3.5 w-3.5" /> {t('Add', 'Tambah')}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {showCaseForm && (
            <div className="grid gap-3 rounded-lg border border-border/60 p-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('Title', 'Judul')}</Label>
                <Input value={caseForm.title} onChange={(e) => setCaseForm({ ...caseForm, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t('Client Name', 'Nama Klien')}</Label>
                <Input value={caseForm.client_name} onChange={(e) => setCaseForm({ ...caseForm, client_name: e.target.value })} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t('Challenge', 'Tantangan')}</Label>
                <Textarea value={caseForm.challenge} onChange={(e) => setCaseForm({ ...caseForm, challenge: e.target.value })} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t('Solution', 'Solusi')}</Label>
                <Textarea value={caseForm.solution} onChange={(e) => setCaseForm({ ...caseForm, solution: e.target.value })} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t('Result', 'Hasil')}</Label>
                <Textarea value={caseForm.result} onChange={(e) => setCaseForm({ ...caseForm, result: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t('Category', 'Kategori')}</Label>
                <Input value={caseForm.category} onChange={(e) => setCaseForm({ ...caseForm, category: e.target.value })} />
              </div>
              <div className="flex items-end">
                <Button onClick={saveCaseStudy} disabled={savingCase} className="w-full gap-2">
                  {savingCase && <Loader2 className="h-4 w-4 animate-spin" />} {t('Save', 'Simpan')}
                </Button>
              </div>
            </div>
          )}

          {caseStudies.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              <TrendingUp className="mx-auto mb-2 h-8 w-8 opacity-50" />
              {t('No case studies yet.', 'Belum ada studi kasus.')}
            </p>
          ) : (
            caseStudies.map((cs) => (
              <div key={cs.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border/60 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{cs.title}</p>
                  <p className="text-xs text-muted-foreground">{cs.client_name}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => destroyCaseStudy(cs.id)} className="gap-1">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
