'use client';

import { useEffect, useState } from 'react';
import { Loader2, Pencil, Trash2 } from 'lucide-react';

import { useLang } from '@/components/language-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

import type { DataTeamBuilder } from '@/features/team-builder/types/teamBuilderTypes';

interface Props {
  team: DataTeamBuilder;
  isSaving: boolean;
  isDeleting: boolean;
  onEditTeamBuilder: (form: { name: string; description: string }) => Promise<boolean>;
  onClearTeamBuilder: () => void;
}

// Owner-only: rename / re-describe the team, or delete it (with a confirm
// dialog — the delete cascades to members and Team Collabs listings).
export default function TeamBuilderSettings({ team, isSaving, isDeleting, onEditTeamBuilder, onClearTeamBuilder }: Props) {
  const { t } = useLang();

  const [filters, setFilters] = useState({ isEditing: false });
  const [form, setForm] = useState({ name: team.name, description: team.description ?? '' });

  const editTeamBuilderForm = (patch: Partial<typeof form>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const editTeamBuilderToggle = () => {
    setFilters((prev) => ({ ...prev, isEditing: !prev.isEditing }));
  };

  const submitTeamBuilder = async () => {
    const saved = await onEditTeamBuilder(form);
    if (saved) setFilters((prev) => ({ ...prev, isEditing: false }));
  };

  useEffect(() => {
    setForm({ name: team.name, description: team.description ?? '' });
  }, [team.name, team.description]);

  return (
    <section className="mt-6">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={editTeamBuilderToggle}>
          <Pencil className="h-3.5 w-3.5" />
          {filters.isEditing ? t('Close editor', 'Tutup editor') : t('Edit team', 'Ubah tim')}
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive" disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              {t('Delete team', 'Hapus tim')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t(`Delete "${team.name}"?`, `Hapus "${team.name}"?`)}</AlertDialogTitle>
              <AlertDialogDescription>
                {t(
                  'All members, invitations and Team Collabs listings for this team are removed too. This cannot be undone.',
                  'Semua member, undangan, dan listing Team Collabs tim ini ikut terhapus. Tindakan ini tidak bisa dibatalkan.'
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('Cancel', 'Batal')}</AlertDialogCancel>
              <AlertDialogAction onClick={onClearTeamBuilder} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {t('Delete team', 'Hapus tim')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {filters.isEditing && (
        <div className="mt-4 space-y-4 rounded-xl border border-border p-5">
          <div className="space-y-2">
            <Label htmlFor="edit-team-name">{t('Team name', 'Nama tim')}</Label>
            <Input id="edit-team-name" value={form.name} onChange={(e) => editTeamBuilderForm({ name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-team-description">{t('Description', 'Deskripsi')}</Label>
            <Textarea
              id="edit-team-description"
              value={form.description}
              onChange={(e) => editTeamBuilderForm({ description: e.target.value })}
              className="min-h-[88px]"
            />
          </div>
          <Button onClick={submitTeamBuilder} disabled={isSaving || !form.name.trim()} className="gap-2">
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('Save changes', 'Simpan perubahan')}
          </Button>
        </div>
      )}
    </section>
  );
}
