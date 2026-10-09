'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

import { useLang } from '@/components/language-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload } from '@/features/uploads/components/FileUpload';

import type { DataAgency } from '@/features/agency/types/agencyTypes';

const statusTone: Record<DataAgency['approval_status'], string> = {
  pending: 'border-warning/50 bg-warning/10 text-warning',
  approved: 'border-success/50 bg-success/10 text-success',
  rejected: 'border-destructive/50 bg-destructive/10 text-destructive',
};

export interface AgencyManageProfileForm {
  name: string;
  description: string;
  whatsapp: string;
  logo_url: string;
}

interface Props {
  agency: DataAgency;
  isSaving: boolean;
  onEditAgencyManage: (form: AgencyManageProfileForm) => void;
}

// Approval status + the owner-editable profile: name, description, the
// agency's own WhatsApp (where "Discuss" leads), and an uploaded logo.
export default function AgencyManageProfile({ agency, isSaving, onEditAgencyManage }: Props) {
  const { t } = useLang();

  const [form, setForm] = useState<AgencyManageProfileForm>({
    name: agency.name,
    description: agency.description,
    whatsapp: agency.whatsapp ?? '',
    logo_url: agency.logo_url ?? '',
  });

  const statusLabel = {
    pending: t('Pending approval', 'Menunggu approval'),
    approved: t('Approved', 'Disetujui'),
    rejected: t('Rejected', 'Ditolak'),
  }[agency.approval_status];

  const statusNote = {
    pending: t(
      'An admin reviews new agencies manually. You can already prepare your profile and services.',
      'Admin meninjau agency baru secara manual. Profil dan layanan sudah bisa kamu siapkan.'
    ),
    approved: t('Your agency and its active services are listed publicly.', 'Agency dan layanan aktifmu tampil untuk publik.'),
    rejected: t(
      'This agency was not approved. Update the profile and contact us if you think this is a mistake.',
      'Agency ini tidak disetujui. Perbarui profil dan hubungi kami jika menurutmu ini keliru.'
    ),
  }[agency.approval_status];

  const editAgencyManageForm = (patch: Partial<AgencyManageProfileForm>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const submitAgencyManage = () => {
    onEditAgencyManage(form);
  };

  useEffect(() => {
    setForm({
      name: agency.name,
      description: agency.description,
      whatsapp: agency.whatsapp ?? '',
      logo_url: agency.logo_url ?? '',
    });
  }, [agency.id, agency.name, agency.description, agency.whatsapp, agency.logo_url]);

  return (
    <section className="rounded-xl border border-border p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="eyebrow text-muted-foreground">{t('Approval status', 'Status approval')}</h2>
          <Badge variant="outline" className={statusTone[agency.approval_status]}>{statusLabel}</Badge>
        </div>
        {agency.approval_status === 'approved' && (
          <Link href={`/agency/${agency.slug}`} className="text-sm font-medium underline underline-offset-4">
            {t('View public page', 'Lihat halaman publik')}
          </Link>
        )}
      </div>
      <p className="mt-2 text-sm text-muted-foreground text-pretty">{statusNote}</p>

      <div className="mt-6 space-y-4 border-t border-border pt-6">
        <FileUpload
          bucket="company-logos"
          label={t('Logo', 'Logo')}
          existingUrl={form.logo_url || null}
          onUpload={(url) => editAgencyManageForm({ logo_url: url })}
        />
        <div className="space-y-2">
          <Label htmlFor="manage_agency_name">{t('Agency name', 'Nama agency')}</Label>
          <Input id="manage_agency_name" value={form.name} onChange={(e) => editAgencyManageForm({ name: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="manage_agency_desc">{t('Description', 'Deskripsi')}</Label>
          <Textarea
            id="manage_agency_desc"
            value={form.description}
            onChange={(e) => editAgencyManageForm({ description: e.target.value })}
            className="min-h-[100px]"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="manage_agency_wa">{t('WhatsApp number', 'Nomor WhatsApp')}</Label>
          <Input
            id="manage_agency_wa"
            inputMode="tel"
            value={form.whatsapp}
            onChange={(e) => editAgencyManageForm({ whatsapp: e.target.value })}
            placeholder="0812xxxxxxx / 62812xxxxxxx"
          />
          <p className="text-xs text-muted-foreground">
            {t(
              '"Discuss" on your services opens a chat with this number. Leave empty to route to MasmasIT.',
              '"Diskusi" di layananmu membuka chat ke nomor ini. Kosongkan untuk diarahkan ke MasmasIT.'
            )}
          </p>
        </div>
        <Button onClick={submitAgencyManage} disabled={isSaving || !form.name.trim() || !form.description.trim()} className="gap-2">
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          {t('Save profile', 'Simpan profil')}
        </Button>
      </div>
    </section>
  );
}
