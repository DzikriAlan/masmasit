'use client';

import { Loader2 } from 'lucide-react';

import { useLang } from '@/components/language-provider';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export interface CoachCourseFormValues {
  title: string;
  description: string;
  level: string;
  category: string;
  price: string;
}

/** Edits a course's own fields; modules, materials and quizzes stay on the page. */
export function CoachCourseEditDialog({
  open,
  values,
  saving,
  onEditCourseForm,
  onSubmitCourse,
  onClearCourse,
}: Readonly<{
  open: boolean;
  values: CoachCourseFormValues;
  saving: boolean;
  onEditCourseForm: (patch: Partial<CoachCourseFormValues>) => void;
  onSubmitCourse: () => void;
  onClearCourse: () => void;
}>) {
  const { t } = useLang();
  const isIncomplete = !values.title.trim() || !values.description.trim();

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClearCourse()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('Edit Course', 'Ubah Kursus')}</DialogTitle>
          <DialogDescription>{t('Changes are visible to students right away.', 'Perubahan langsung terlihat oleh siswa.')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-ctitle">{t('Title', 'Judul')}</Label>
            <Input id="edit-ctitle" value={values.title} onChange={(e) => onEditCourseForm({ title: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-cdesc">{t('Description', 'Deskripsi')}</Label>
            <Textarea id="edit-cdesc" value={values.description} onChange={(e) => onEditCourseForm({ description: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>{t('Level', 'Level')}</Label>
              <Select value={values.level} onValueChange={(v) => onEditCourseForm({ level: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">{t('Beginner', 'Pemula')}</SelectItem>
                  <SelectItem value="intermediate">{t('Intermediate', 'Menengah')}</SelectItem>
                  <SelectItem value="advanced">{t('Advanced', 'Mahir')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-ccat">{t('Category', 'Kategori')}</Label>
              <Input id="edit-ccat" value={values.category} onChange={(e) => onEditCourseForm({ category: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-cprice">{t('Price (IDR)', 'Harga (IDR)')}</Label>
              <Input id="edit-cprice" type="number" min="0" value={values.price} onChange={(e) => onEditCourseForm({ price: e.target.value })} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClearCourse}>{t('Cancel', 'Batal')}</Button>
          <Button onClick={onSubmitCourse} disabled={saving || isIncomplete} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} {t('Save changes', 'Simpan perubahan')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
