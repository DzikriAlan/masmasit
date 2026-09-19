'use client';

import { Loader2 } from 'lucide-react';

import { useLang } from '@/components/language-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export interface ProjectsFormValues {
  title: string;
  description: string;
  budget_min: string;
  budget_max: string;
  deadline: string;
}

/**
 * The "post a project" composer. Split out of ProjectsList so the browse
 * page stays about browsing, and the form owns its own labels, helper text
 * and disabled reasoning.
 */
export function ProjectsPostForm({
  values,
  saving,
  onEditProjects,
  onSubmitProjects,
  onClearProjects,
}: Readonly<{
  values: ProjectsFormValues;
  saving: boolean;
  onEditProjects: (patch: Partial<ProjectsFormValues>) => void;
  onSubmitProjects: () => void;
  onClearProjects: () => void;
}>) {
  const { t } = useLang();

  const isIncomplete = !values.title.trim() || !values.description.trim();

  return (
    <Card className="mb-8 border-dashed">
      <CardHeader>
        <CardTitle className="font-display text-xl">{t('Post a new project', 'Pasang proyek baru')}</CardTitle>
        <CardDescription>
          {t('Describe the work and the budget — members bid, you pick.', 'Jelaskan pekerjaan dan budgetnya — member menawar, Anda memilih.')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="project-title">{t('Title', 'Judul')}</Label>
          <Input
            id="project-title"
            value={values.title}
            onChange={(event) => onEditProjects({ title: event.target.value })}
            placeholder={t('E-commerce website development', 'Pengembangan website e-commerce')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="project-description">{t('Description', 'Deskripsi')}</Label>
          <Textarea
            id="project-description"
            value={values.description}
            onChange={(event) => onEditProjects({ description: event.target.value })}
            placeholder={t('Scope, deliverables, and anything a bidder must know…', 'Scope, deliverable, dan hal yang wajib diketahui penawar…')}
            className="min-h-[120px]"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="project-budget-min">{t('Budget min (IDR)', 'Budget min (IDR)')}</Label>
            <Input
              id="project-budget-min"
              type="number"
              inputMode="numeric"
              value={values.budget_min}
              onChange={(event) => onEditProjects({ budget_min: event.target.value })}
              placeholder="5000000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-budget-max">{t('Budget max (IDR)', 'Budget max (IDR)')}</Label>
            <Input
              id="project-budget-max"
              type="number"
              inputMode="numeric"
              value={values.budget_max}
              onChange={(event) => onEditProjects({ budget_max: event.target.value })}
              placeholder="15000000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-deadline">{t('Deadline', 'Tenggat')}</Label>
            <Input
              id="project-deadline"
              type="date"
              value={values.deadline}
              onChange={(event) => onEditProjects({ deadline: event.target.value })}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
          <Button onClick={onSubmitProjects} disabled={saving || isIncomplete} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('Post project', 'Pasang proyek')}
          </Button>
          <Button variant="ghost" onClick={onClearProjects}>
            {t('Cancel', 'Batal')}
          </Button>
          {isIncomplete && (
            <p className="text-xs text-muted-foreground">
              {t('A title and description are required.', 'Judul dan deskripsi wajib diisi.')}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
