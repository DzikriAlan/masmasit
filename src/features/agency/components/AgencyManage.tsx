'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { LoadData } from '@/components/load-data';
import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toWaNumber } from '@/shared/lib/external';
import { toneOf } from '@/shared/lib/tones';
import { loginHref } from '@/shared/lib/utils';

import { useAgencyManageControllers } from '@/features/agency/controllers/agencyControllers';
import AgencyManageProfile, { type AgencyManageProfileForm } from '@/features/agency/components/AgencyManageProfile';
import AgencyManageServices from '@/features/agency/components/AgencyManageServices';
import type { AgencyManageServiceFormValues } from '@/features/agency/components/AgencyManageServiceForm';

// "My Agency" (/agency/manage): the agency owner's own dashboard — approval
// status, profile (incl. logo upload + WhatsApp), and their service catalogue.
export default function AgencyManage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { t } = useLang();
  const {
    fetchAgencyManage,
    modifyAgencyManage,
    storeAgencyServices,
    modifyAgencyServices,
    removeAgencyServices,
  } = useAgencyManageControllers(user?.id ?? '');

  const [filters, setFilters] = useState({ agencyId: '' });

  const data = useMemo(() => {
    const list = fetchAgencyManage.data ?? [];
    const selected = list.find((agency) => agency.id === filters.agencyId) ?? list[0] ?? null;
    const isBlocked = loading || !user;

    return {
      data: list,
      selected,
      services: selected?.agency_services ?? [],
      hasMany: list.length > 1,
      isLoading: isBlocked || fetchAgencyManage.isPending,
      isError: fetchAgencyManage.isError,
      isEmpty: !isBlocked && !fetchAgencyManage.isPending && !fetchAgencyManage.isError && list.length === 0,
      errorTitle: t('Could not load your agency.', 'Gagal memuat agency kamu.'),
      errorSubtitle: t('Check your connection and try again.', 'Periksa koneksi lalu coba lagi.'),
      emptyTitle: t("You don't own an agency yet.", 'Kamu belum punya agency.'),
      emptySubtitle: t('Register one — approval is manual and usually quick.', 'Daftarkan satu — persetujuan manual dan biasanya cepat.'),
    };
  }, [fetchAgencyManage.data, fetchAgencyManage.isPending, fetchAgencyManage.isError, filters.agencyId, loading, user, t]);

  const editAgencyManageSelected = (agencyId: string) => {
    setFilters((prev) => ({ ...prev, agencyId }));
  };

  const editAgencyManage = async (form: AgencyManageProfileForm) => {
    if (!data.selected) return;
    const whatsapp = form.whatsapp.trim() ? toWaNumber(form.whatsapp) : null;
    if (whatsapp && !/^[0-9]{8,15}$/.test(whatsapp)) {
      toast.error(t('Enter a valid WhatsApp number', 'Masukkan nomor WhatsApp yang valid'));
      return;
    }
    try {
      await modifyAgencyManage.mutateAsync({
        id: data.selected.id,
        name: form.name.trim(),
        description: form.description.trim(),
        whatsapp,
        logo_url: form.logo_url || null,
      });
    } catch {
      toast.error(t('Failed to save profile', 'Gagal menyimpan profil'));
      return;
    }
    toast.success(t('Profile saved', 'Profil tersimpan'));
  };

  const submitAgencyServices = async (form: AgencyManageServiceFormValues) => {
    if (!data.selected) return false;
    const price = form.base_price.trim() ? Math.max(0, Math.round(Number(form.base_price))) : null;
    try {
      await storeAgencyServices.mutateAsync({
        agency_id: data.selected.id,
        title: form.title.trim(),
        category: form.category,
        description: form.description.trim(),
        base_price: Number.isFinite(price) ? price : null,
        is_active: true,
      });
    } catch {
      toast.error(t('Failed to add service', 'Gagal menambah layanan'));
      return false;
    }
    toast.success(t('Service added', 'Layanan ditambahkan'));
    return true;
  };

  const editAgencyServices = async (id: string, form: AgencyManageServiceFormValues) => {
    const price = form.base_price.trim() ? Math.max(0, Math.round(Number(form.base_price))) : null;
    try {
      await modifyAgencyServices.mutateAsync({
        id,
        title: form.title.trim(),
        category: form.category,
        description: form.description.trim(),
        base_price: Number.isFinite(price) ? price : null,
      });
    } catch {
      toast.error(t('Failed to save service', 'Gagal menyimpan layanan'));
      return false;
    }
    toast.success(t('Service saved', 'Layanan tersimpan'));
    return true;
  };

  const editAgencyServicesActive = async (id: string, isActive: boolean) => {
    try {
      await modifyAgencyServices.mutateAsync({ id, is_active: isActive });
    } catch {
      toast.error(t('Failed to update service', 'Gagal memperbarui layanan'));
      return;
    }
    toast.success(isActive ? t('Service activated', 'Layanan diaktifkan') : t('Service deactivated', 'Layanan dinonaktifkan'));
  };

  const clearAgencyServices = async (id: string) => {
    try {
      await removeAgencyServices.mutateAsync(id);
    } catch {
      toast.error(t('Failed to delete service', 'Gagal menghapus layanan'));
      return;
    }
    toast.success(t('Service deleted', 'Layanan dihapus'));
  };

  useEffect(() => {
    if (!loading && !user) router.push(loginHref());
  }, [loading, user, router]);

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow={t('Ecosystem · Business', 'Ekosistem · Bisnis')}
          tone={toneOf('agency')}
          title={t('My Agency', 'Agency Saya')}
          subtitle={t(
            'Your approval status, public profile, and service catalogue in one place.',
            'Status approval, profil publik, dan katalog layananmu di satu tempat.'
          )}
          action={
            <Link href="/agency/register">
              <Button variant="outline">{t('Register another', 'Daftarkan lagi')}</Button>
            </Link>
          }
        />

        <LoadData hideIcon response={data}>
          {data.selected && (
            <div className="space-y-6">
              {data.hasMany && (
                <Select value={data.selected.id} onValueChange={editAgencyManageSelected}>
                  <SelectTrigger className="sm:max-w-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {data.data.map((agency) => <SelectItem key={agency.id} value={agency.id}>{agency.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              <AgencyManageProfile
                agency={data.selected}
                isSaving={modifyAgencyManage.isPending}
                onEditAgencyManage={editAgencyManage}
              />
              <AgencyManageServices
                services={data.services}
                isSaving={storeAgencyServices.isPending || modifyAgencyServices.isPending}
                onSubmitAgencyServices={submitAgencyServices}
                onEditAgencyServices={editAgencyServices}
                onEditAgencyServicesActive={editAgencyServicesActive}
                onClearAgencyServices={clearAgencyServices}
              />
            </div>
          )}
        </LoadData>
      </div>
    </AppShell>
  );
}
