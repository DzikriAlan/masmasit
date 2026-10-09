'use client';

import { useMemo, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';

import { useLang } from '@/components/language-provider';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import type { DataAgencyServices } from '@/features/agency/types/agencyTypes';
import AgencyManageServiceForm, { type AgencyManageServiceFormValues } from '@/features/agency/components/AgencyManageServiceForm';

interface Props {
  services: DataAgencyServices[];
  isSaving: boolean;
  onSubmitAgencyServices: (form: AgencyManageServiceFormValues) => Promise<boolean>;
  onEditAgencyServices: (id: string, form: AgencyManageServiceFormValues) => Promise<boolean>;
  onEditAgencyServicesActive: (id: string, isActive: boolean) => void;
  onClearAgencyServices: (id: string) => void;
}

// The owner's own catalogue: add, edit, activate/deactivate, delete. Admins
// keep managing the same rows from the admin Catalog.
export default function AgencyManageServices({
  services,
  isSaving,
  onSubmitAgencyServices,
  onEditAgencyServices,
  onEditAgencyServicesActive,
  onClearAgencyServices,
}: Props) {
  const { t } = useLang();

  const [filters, setFilters] = useState({ editingId: '' });

  const data = useMemo(() => {
    const getPrice = (price: number | null) =>
      price === null
        ? t('Quoted per project', 'Harga per proyek')
        : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

    return services.map((service) => ({
      ...service,
      priceLabel: getPrice(service.base_price),
      formValues: {
        title: service.title,
        category: service.category,
        description: service.description,
        base_price: service.base_price === null ? '' : String(service.base_price),
      },
    }));
  }, [services, t]);

  const editAgencyServicesRow = (id: string) => {
    setFilters((prev) => ({ ...prev, editingId: prev.editingId === id ? '' : id }));
  };

  const submitAgencyServicesEdit = async (id: string, form: AgencyManageServiceFormValues) => {
    const saved = await onEditAgencyServices(id, form);
    if (saved) setFilters((prev) => ({ ...prev, editingId: '' }));
    return saved;
  };

  return (
    <section className="rounded-xl border border-border p-5">
      <h2 className="eyebrow text-muted-foreground">{t('Services', 'Layanan')}</h2>

      {data.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{t('No services yet — add your first below.', 'Belum ada layanan — tambahkan yang pertama di bawah.')}</p>
      ) : (
        <div className="mt-3 divide-y divide-border border-y border-border">
          {data.map((service) => (
            <div key={service.id} className="py-4">
              {filters.editingId === service.id ? (
                <AgencyManageServiceForm
                  initial={service.formValues}
                  submitLabel={t('Save service', 'Simpan layanan')}
                  isSaving={isSaving}
                  onSubmitAgencyServices={(form) => submitAgencyServicesEdit(service.id, form)}
                  onClearAgencyServices={() => editAgencyServicesRow(service.id)}
                />
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{service.title}</p>
                      <Badge variant="outline" className="text-xs">{service.category}</Badge>
                      {!service.is_active && (
                        <Badge variant="outline" className="text-xs text-muted-foreground">{t('Inactive', 'Nonaktif')}</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{service.description}</p>
                    <p className="mt-1 text-sm font-medium text-foreground">{service.priceLabel}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Switch checked={service.is_active} onCheckedChange={(checked) => onEditAgencyServicesActive(service.id, checked)} />
                      {t('Active', 'Aktif')}
                    </label>
                    <button onClick={() => editAgencyServicesRow(service.id)} className="text-muted-foreground hover:text-foreground" aria-label={t('Edit service', 'Ubah layanan')}>
                      <Pencil className="h-4 w-4" />
                    </button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="text-muted-foreground hover:text-destructive" aria-label={t('Delete service', 'Hapus layanan')}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t(`Delete "${service.title}"?`, `Hapus "${service.title}"?`)}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('To hide it temporarily, switch it to inactive instead.', 'Untuk menyembunyikan sementara, nonaktifkan saja.')}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('Cancel', 'Batal')}</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onClearAgencyServices(service.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {t('Delete', 'Hapus')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6">
        <p className="mb-3 text-sm font-semibold">{t('Add a service', 'Tambah layanan')}</p>
        <AgencyManageServiceForm
          submitLabel={t('Add service', 'Tambah layanan')}
          isSaving={isSaving}
          onSubmitAgencyServices={onSubmitAgencyServices}
        />
      </div>
    </section>
  );
}
