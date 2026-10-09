'use client';

import { useLang } from '@/components/language-provider';
import { SkillTagInput, type SkillTag } from '@/components/skill-tag-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import type { DataJobsLocation, DataJobsSkill, DataJobsType } from '@/features/jobs/types/jobsEditTypes';

export interface JobsPostingValues {
  title: string;
  description: string;
  location: string;
  job_type: string;
  salary_min: string;
  salary_max: string;
  deadline: string;
  skills: string[];
}

const NO_LOCATION = '__none';

/**
 * The job fields shared by "Post a Job" and "Edit job". Job type and location
 * options come from the job_types / job_locations reference tables.
 */
export function JobsPostingFields({
  values,
  jobTypes,
  locations,
  skillsCatalog,
  onEditJobsPosting,
}: Readonly<{
  values: JobsPostingValues;
  jobTypes: DataJobsType[];
  locations: DataJobsLocation[];
  skillsCatalog: DataJobsSkill[];
  onEditJobsPosting: (patch: Partial<JobsPostingValues>) => void;
}>) {
  const { t } = useLang();

  // A posting saved before the reference list existed keeps its own value as an option.
  const locationOptions = values.location && !locations.some((l) => l.name === values.location)
    ? [...locations.map((l) => l.name), values.location]
    : locations.map((l) => l.name);
  const typeOptions = values.job_type && !jobTypes.some((jt) => jt.slug === values.job_type)
    ? [...jobTypes, { slug: values.job_type, label_en: values.job_type, label_id: values.job_type, sort_order: 999 }]
    : jobTypes;
  const skillTags: SkillTag[] = values.skills.map((name) => ({
    id: skillsCatalog.find((s) => s.name.toLowerCase() === name.toLowerCase())?.id ?? null,
    name,
  }));

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="jtitle">{t('Job Title', 'Judul Lowongan')}</Label>
        <Input id="jtitle" value={values.title} onChange={(e) => onEditJobsPosting({ title: e.target.value })} placeholder={t('Senior Frontend Developer', 'Senior Frontend Developer')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="jdesc">{t('Description', 'Deskripsi')}</Label>
        <Textarea id="jdesc" value={values.description} onChange={(e) => onEditJobsPosting({ description: e.target.value })} placeholder={t('Detailed job description...', 'Deskripsi pekerjaan detail...')} className="min-h-[120px]" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{t('Location', 'Lokasi')}</Label>
          <Select
            value={values.location || NO_LOCATION}
            onValueChange={(v) => onEditJobsPosting({ location: v === NO_LOCATION ? '' : v })}
          >
            <SelectTrigger><SelectValue placeholder={t('Select location…', 'Pilih lokasi…')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_LOCATION}>{t('Not specified', 'Tidak disebutkan')}</SelectItem>
              {locationOptions.map((name) => (
                <SelectItem key={name} value={name}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{t('Job Type', 'Tipe Pekerjaan')}</Label>
          <Select value={values.job_type} onValueChange={(v) => onEditJobsPosting({ job_type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {typeOptions.map((jt) => (
                <SelectItem key={jt.slug} value={jt.slug}>{t(jt.label_en, jt.label_id)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="jskills">{t('Required skills', 'Skill yang dibutuhkan')}</Label>
        <SkillTagInput
          id="jskills"
          options={skillsCatalog}
          value={skillTags}
          onChange={(tags) => onEditJobsPosting({ skills: tags.map((tag) => tag.name) })}
          max={15}
        />
        <p className="text-xs text-muted-foreground">
          {t('Members see how well their skills match this role.', 'Member melihat seberapa cocok skill mereka dengan posisi ini.')}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="jsmin">{t('Salary Min (IDR)', 'Gaji Min (IDR)')}</Label>
          <Input id="jsmin" type="number" value={values.salary_min} onChange={(e) => onEditJobsPosting({ salary_min: e.target.value })} placeholder="5000000" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="jsmax">{t('Salary Max (IDR)', 'Gaji Max (IDR)')}</Label>
          <Input id="jsmax" type="number" value={values.salary_max} onChange={(e) => onEditJobsPosting({ salary_max: e.target.value })} placeholder="10000000" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="jdead">{t('Deadline', 'Tenggat')}</Label>
        <Input id="jdead" type="date" value={values.deadline} onChange={(e) => onEditJobsPosting({ deadline: e.target.value })} />
      </div>
    </>
  );
}
