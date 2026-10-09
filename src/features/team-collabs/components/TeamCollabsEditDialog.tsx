'use client';

import { useState } from 'react';
import { Loader2, Pencil } from 'lucide-react';

import { useLang } from '@/components/language-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Props {
  focus: string;
  description: string;
  isSaving: boolean;
  onEditTeamCollabs: (form: { focus: string; description: string }) => Promise<boolean>;
}

// Owner-only, and only rendered while the listing is still Open — once an
// admin matches it (or the owner withdraws) the listing is frozen, which
// update_own_team_collabs enforces server-side too (migration 032).
export default function TeamCollabsEditDialog({ focus, description, isSaving, onEditTeamCollabs }: Props) {
  const { t } = useLang();

  const [filters, setFilters] = useState({ isOpen: false });
  const [form, setForm] = useState({ focus, description });

  const editTeamCollabsOpen = (isOpen: boolean) => {
    setFilters((prev) => ({ ...prev, isOpen }));
    if (isOpen) setForm({ focus, description });
  };

  const editTeamCollabsForm = (patch: Partial<typeof form>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const submitTeamCollabs = async () => {
    const saved = await onEditTeamCollabs({ focus: form.focus.trim(), description: form.description.trim() });
    if (saved) setFilters((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <Dialog open={filters.isOpen} onOpenChange={editTeamCollabsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="mt-2 w-full gap-1.5">
          <Pencil className="h-3.5 w-3.5" />
          {t('Edit listing', 'Ubah listing')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Edit listing', 'Ubah listing')}</DialogTitle>
          <DialogDescription>
            {t('You can edit while the listing is Open.', 'Listing bisa diubah selama masih Terbuka.')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="collab-focus">{t('Focus', 'Fokus')}</Label>
            <Input id="collab-focus" value={form.focus} onChange={(e) => editTeamCollabsForm({ focus: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="collab-description">{t('Description', 'Deskripsi')}</Label>
            <Textarea
              id="collab-description"
              value={form.description}
              onChange={(e) => editTeamCollabsForm({ description: e.target.value })}
              className="min-h-[100px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submitTeamCollabs} disabled={isSaving || !form.focus.trim() || !form.description.trim()} className="gap-2">
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('Save changes', 'Simpan perubahan')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
