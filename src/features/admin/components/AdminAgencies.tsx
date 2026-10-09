'use client';

import { useState } from 'react';
import { Building2, Loader2, Pencil, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

import { useLang } from '@/components/language-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import type { DataAdminAgencies } from '@/features/admin/types/adminTypes';
import { useAdminAgenciesControllers } from '@/features/admin/controllers/adminControllers';

const EMPTY_FORM = { name: '', description: '', logo_url: '' };

interface Props {
  enabled: boolean;
}

/** Agencies: edit and delete (TC-14-07). The in-house agency cannot be deleted. */
export default function AdminAgencies({ enabled }: Props) {
  const { t } = useLang();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { fetchAdminAgencies, changeAdminAgency, removeAdminAgency } = useAdminAgenciesControllers(enabled);

  const agencies = fetchAdminAgencies.data ?? [];
  const saving = changeAdminAgency.isPending;

  const editAgency = (agency: DataAdminAgencies) => {
    setEditingId(agency.id);
    setForm({ name: agency.name, description: agency.description, logo_url: agency.logo_url ?? '' });
  };

  const clearForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const submitAgency = async () => {
    if (!editingId) return;
    if (!form.name.trim() || !form.description.trim()) {
      toast.error(t('Name and description are required', 'Nama dan deskripsi wajib diisi'));
      return;
    }
    try {
      await changeAdminAgency.mutateAsync({
        id: editingId,
        data: { name: form.name.trim(), description: form.description.trim(), logo_url: form.logo_url.trim() || null },
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('Failed to update agency', 'Gagal memperbarui agency'));
      return;
    }
    toast.success(t('Agency updated', 'Agency diperbarui'));
    clearForm();
  };

  const submitDelete = async (agency: DataAdminAgencies) => {
    if (!window.confirm(t(`Delete agency "${agency.name}"? Its services are deleted too.`, `Hapus agency "${agency.name}"? Layanannya ikut terhapus.`))) return;
    try {
      await removeAdminAgency.mutateAsync(agency.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('Failed to delete agency', 'Gagal menghapus agency'));
      return;
    }
    toast.success(t('Agency deleted', 'Agency dihapus'));
    if (editingId === agency.id) clearForm();
  };

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" /> {t('Agencies', 'Agency')}</CardTitle>
        <CardDescription>{t('Edit or remove agencies listed on the platform.', 'Ubah atau hapus agency yang terdaftar di platform.')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {fetchAdminAgencies.isPending ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : agencies.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('No agencies yet.', 'Belum ada agency.')}</p>
        ) : (
          agencies.map((a) => (
            <div key={a.id} className="rounded-lg border border-border/60 p-3">
              {editingId === a.id ? (
                <div className="grid gap-3">
                  <div className="space-y-2">
                    <Label>{t('Name', 'Nama')}</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('Description', 'Deskripsi')}</Label>
                    <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('Logo URL (optional)', 'URL Logo (opsional)')}</Label>
                    <Input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={submitAgency} disabled={saving} className="gap-2">
                      {saving && <Loader2 className="h-4 w-4 animate-spin" />} {t('Save', 'Simpan')}
                    </Button>
                    <Button size="sm" variant="outline" onClick={clearForm} className="gap-1">
                      <X className="h-3.5 w-3.5" /> {t('Cancel', 'Batal')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium">{a.name}</p>
                      <Badge variant={a.approval_status === 'approved' ? 'default' : a.approval_status === 'rejected' ? 'destructive' : 'secondary'} className="text-xs capitalize">
                        {a.approval_status}
                      </Badge>
                      {a.is_in_house && <Badge variant="outline" className="text-xs">{t('In-house', 'In-house')}</Badge>}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{a.profiles?.full_name ?? 'MasmasIT'} · {a.description}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => editAgency(a)} className="gap-1">
                    <Pencil className="h-3.5 w-3.5" /> {t('Edit', 'Ubah')}
                  </Button>
                  {!a.is_in_house && (
                    <Button size="sm" variant="outline" onClick={() => submitDelete(a)} disabled={removeAdminAgency.isPending} className="gap-1 text-destructive hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
