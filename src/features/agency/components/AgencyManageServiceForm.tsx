'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

import { useLang } from '@/components/language-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// agency_services.category CHECK (migration 006).
const SERVICE_CATEGORIES = ['SaaS', 'AI Solutions', 'Creative Services', 'HR Solutions'];

export interface AgencyManageServiceFormValues {
  title: string;
  category: string;
  description: string;
  base_price: string;
}

interface Props {
  initial?: AgencyManageServiceFormValues;
  submitLabel: string;
  isSaving: boolean;
  onSubmitAgencyServices: (form: AgencyManageServiceFormValues) => Promise<boolean>;
  onClearAgencyServices?: () => void;
}

// Shared by "Add service" and a row's inline edit.
export default function AgencyManageServiceForm({ initial, submitLabel, isSaving, onSubmitAgencyServices, onClearAgencyServices }: Props) {
  const { t } = useLang();

  const [form, setForm] = useState<AgencyManageServiceFormValues>(
    initial ?? { title: '', category: '', description: '', base_price: '' }
  );

  const isValid = Boolean(form.title.trim() && form.category && form.description.trim());

  const editAgencyServicesForm = (patch: Partial<AgencyManageServiceFormValues>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const submitAgencyServices = async () => {
    const saved = await onSubmitAgencyServices(form);
    if (saved && !initial) setForm({ title: '', category: '', description: '', base_price: '' });
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{t('Title', 'Judul')}</Label>
          <Input value={form.title} onChange={(e) => editAgencyServicesForm({ title: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>{t('Category', 'Kategori')}</Label>
          <Select value={form.category} onValueChange={(value) => editAgencyServicesForm({ category: value })}>
            <SelectTrigger><SelectValue placeholder={t('Pick a category', 'Pilih kategori')} /></SelectTrigger>
            <SelectContent>
              {SERVICE_CATEGORIES.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>{t('Description', 'Deskripsi')}</Label>
        <Textarea value={form.description} onChange={(e) => editAgencyServicesForm({ description: e.target.value })} className="min-h-[80px]" />
      </div>
      <div className="space-y-2">
        <Label>{t('Base price (Rp, optional)', 'Harga dasar (Rp, opsional)')}</Label>
        <Input
          type="number"
          min={0}
          inputMode="numeric"
          value={form.base_price}
          onChange={(e) => editAgencyServicesForm({ base_price: e.target.value })}
          placeholder={t('Empty = quoted per project', 'Kosong = dihitung per proyek')}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={submitAgencyServices} disabled={isSaving || !isValid} className="gap-2">
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
        {onClearAgencyServices && (
          <Button size="sm" variant="ghost" onClick={onClearAgencyServices}>{t('Cancel', 'Batal')}</Button>
        )}
      </div>
    </div>
  );
}
