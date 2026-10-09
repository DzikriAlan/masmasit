'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { useLang } from '@/components/language-provider';
import { LoadData } from '@/components/load-data';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

import { useJobsEditControllers, useJobsReferenceControllers } from '@/features/jobs/controllers/jobsEditControllers';
import { JobsPostingFields, type JobsPostingValues } from '@/features/jobs/components/JobsPostingFields';

const EMPTY_VALUES: JobsPostingValues = {
  title: '', description: '', location: '', job_type: 'full-time',
  salary_min: '', salary_max: '', deadline: '', skills: [],
};

/** "Edit" on /jobs/applicants: the post-job form, prefilled from the saved posting. */
export function JobsEditDialog({
  jobId,
  onClearJobsEdit,
}: Readonly<{ jobId: string | null; onClearJobsEdit: () => void }>) {
  const { t } = useLang();
  const { fetchJobsEditable, modifyJobs } = useJobsEditControllers(jobId);
  const { fetchJobsTypes, fetchJobsLocations, fetchJobsSkillsCatalog } = useJobsReferenceControllers(Boolean(jobId));
  const [values, setValues] = useState<JobsPostingValues>(EMPTY_VALUES);

  const job = fetchJobsEditable.data ?? null;

  useEffect(() => {
    if (!job) return;
    setValues({
      title: job.title,
      description: job.description,
      location: job.location ?? '',
      job_type: job.job_type,
      salary_min: job.salary_min != null ? String(job.salary_min) : '',
      salary_max: job.salary_max != null ? String(job.salary_max) : '',
      deadline: job.deadline ?? '',
      skills: job.skills ?? [],
    });
  }, [job]);

  const editJobsPosting = (patch: Partial<JobsPostingValues>) => {
    setValues((prev) => ({ ...prev, ...patch }));
  };

  const submitJobsEdit = async () => {
    try {
      await modifyJobs.mutateAsync({
        title: values.title.trim(),
        description: values.description.trim(),
        location: values.location || null,
        job_type: values.job_type,
        salary_min: values.salary_min ? parseInt(values.salary_min) : null,
        salary_max: values.salary_max ? parseInt(values.salary_max) : null,
        deadline: values.deadline || null,
        skills: values.skills,
      });
    } catch {
      toast.error(t('Failed to update job', 'Gagal memperbarui lowongan'));
      return;
    }
    toast.success(t('Job updated', 'Lowongan diperbarui'));
    onClearJobsEdit();
  };

  const isIncomplete = !values.title.trim() || !values.description.trim();

  return (
    <Dialog open={Boolean(jobId)} onOpenChange={(open) => !open && onClearJobsEdit()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('Edit job', 'Ubah lowongan')}</DialogTitle>
          <DialogDescription>{t('Changes are visible on the job page right away.', 'Perubahan langsung terlihat di halaman lowongan.')}</DialogDescription>
        </DialogHeader>
        <LoadData
          response={{
            isLoading: fetchJobsEditable.isPending,
            isError: fetchJobsEditable.isError,
            isEmpty: !fetchJobsEditable.isPending && !job,
            emptyTitle: t('Job not found.', 'Lowongan tidak ditemukan.'),
          }}
        >
          <div className="space-y-4">
            <JobsPostingFields
              values={values}
              jobTypes={fetchJobsTypes.data ?? []}
              locations={fetchJobsLocations.data ?? []}
              skillsCatalog={fetchJobsSkillsCatalog.data ?? []}
              onEditJobsPosting={editJobsPosting}
            />
          </div>
        </LoadData>
        <DialogFooter>
          <Button variant="outline" onClick={onClearJobsEdit}>{t('Cancel', 'Batal')}</Button>
          <Button onClick={submitJobsEdit} disabled={modifyJobs.isPending || !job || isIncomplete} className="gap-2">
            {modifyJobs.isPending && <Loader2 className="h-4 w-4 animate-spin" />} {t('Save changes', 'Simpan perubahan')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
