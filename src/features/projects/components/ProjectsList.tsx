'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import type { DataProjects } from '@/features/projects/types/projectsTypes';
import { useProjectsControllers } from '@/features/projects/controllers/projectsControllers';
import { ProjectsCard } from '@/features/projects/components/ProjectsCard';
import { ProjectsPostForm, type ProjectsFormValues } from '@/features/projects/components/ProjectsPostForm';

import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { LoadData } from '@/components/load-data';
import { BrowseToolbar } from '@/components/browse-toolbar';
import { CardGridSkeleton } from '@/components/card-skeleton';
import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { signedOutState } from '@/shared/lib/browse-gate';
import { Button } from '@/components/ui/button';
import { toneOf } from '@/shared/lib/tones';
import { loginHref } from '@/shared/lib/utils';

const EMPTY_FORM: ProjectsFormValues = { title: '', description: '', budget_min: '', budget_max: '', deadline: '' };

export default function ProjectsList() {
  const { t } = useLang();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { fetchProjects, storeProjects, setGetProjects } = useProjectsControllers();

  const [filters, setFilters] = useState({
    search: '',
    filter: { status: 'open' },
    isComposerOpen: false,
  });
  const [form, setForm] = useState<ProjectsFormValues>(EMPTY_FORM);

  const data = useMemo(() => {
    const getBudget = (min: number | null, max: number | null) => {
      if (!min && !max) return t('Budget negotiable', 'Budget negosiasi');
      if (min && max) return `Rp ${(min / 1000000).toFixed(1)}–${(max / 1000000).toFixed(1)} jt`;
      if (min) return `Rp ${(min / 1000000).toFixed(1)} jt+`;
      return `${t('Up to', 'Hingga')} Rp ${((max as number) / 1000000).toFixed(1)} jt`;
    };

    const getStatusLabel = (status: string) => {
      const labels: Record<string, string> = {
        open: t('Open', 'Terbuka'),
        in_progress: t('In progress', 'Berjalan'),
        completed: t('Completed', 'Selesai'),
      };
      return labels[status] ?? status.replace('_', ' ');
    };

    const getMappedProject = (project: DataProjects) => ({
      id: project.id,
      title: project.title,
      description: project.description,
      status: project.status,
      statusLabel: getStatusLabel(project.status),
      budget: getBudget(project.budget_min, project.budget_max),
      deadline: project.deadline
        ? new Date(project.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
        : null,
      author: project.profiles?.full_name ?? t('Anonymous', 'Anonim'),
    });

    const list = (fetchProjects.data ?? []).map(getMappedProject);
    const isFiltered = Boolean(filters.search) || filters.filter.status !== 'open';

    return {
      data: list,
      isLoading: fetchProjects.isPending,
      isError: fetchProjects.isError,
      ...signedOutState(!authLoading && !user, t, t('projects', 'proyek')),
      isEmpty: !fetchProjects.isPending && !fetchProjects.isError && list.length === 0,
      errorTitle: t('Could not load projects.', 'Gagal memuat proyek.'),
      errorSubtitle: t('Check your connection and try again.', 'Periksa koneksi lalu coba lagi.'),
      emptyTitle: isFiltered
        ? t('No projects match these filters.', 'Tidak ada proyek yang cocok.')
        : t('No open projects right now.', 'Belum ada proyek terbuka saat ini.'),
      emptySubtitle: isFiltered
        ? t('Try another status, or a broader search.', 'Coba status lain, atau kata kunci yang lebih umum.')
        : t('Post the first one and let members bid on it.', 'Pasang yang pertama dan biarkan member menawar.'),
    };
  }, [fetchProjects.data, fetchProjects.isPending, fetchProjects.isError, filters, t, user, authLoading]);

  const toolbarFilters = useMemo(
    () => [
      {
        key: 'status',
        label: t('Status', 'Status'),
        value: filters.filter.status,
        anyValue: 'open',
        width: 'sm:w-48',
        options: [
          { value: 'open', label: t('Open for bids', 'Terbuka untuk tawaran') },
          { value: 'in_progress', label: t('In progress', 'Sedang berjalan') },
          { value: 'completed', label: t('Completed', 'Selesai') },
          { value: 'all', label: t('Any status', 'Semua status') },
        ],
      },
    ],
    [filters.filter.status, t]
  );

  const editProjectsSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  };

  const editProjectsFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, filter: { ...prev.filter, [key]: value } }));
  };

  const clearProjectsFilters = () => {
    setFilters((prev) => ({ ...prev, search: '', filter: { status: 'open' } }));
  };

  const editProjectsComposer = () => {
    if (!user) {
      router.push(loginHref());
      return;
    }
    setFilters((prev) => ({ ...prev, isComposerOpen: !prev.isComposerOpen }));
  };

  const editProjectsForm = (patch: Partial<ProjectsFormValues>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const clearProjectsForm = () => {
    setForm(EMPTY_FORM);
    setFilters((prev) => ({ ...prev, isComposerOpen: false }));
  };

  const submitProjects = async () => {
    if (!user) {
      router.push(loginHref());
      return;
    }

    const getNumeric = (value: string) => (value ? Number.parseInt(value, 10) : null);

    try {
      await storeProjects.mutateAsync({
        user_id: user.id,
        title: form.title,
        description: form.description,
        budget_min: getNumeric(form.budget_min),
        budget_max: getNumeric(form.budget_max),
        deadline: form.deadline || null,
      });
    } catch {
      toast.error(t('Failed to post project', 'Gagal memposting proyek'));
      return;
    }

    toast.success(t('Project posted', 'Proyek diposting'));
    clearProjectsForm();
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      setGetProjects({ search: filters.search, statusFilter: filters.filter.status });
    }, 300);
    return () => clearTimeout(timeout);
  }, [filters.search, filters.filter.status, setGetProjects]);

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow={t('Product · Work', 'Product · Kerja')}
          tone={toneOf('projects')}
          title={t('Project Portal', 'Portal Proyek')}
          subtitle={t(
            'Outsource work or win freelance IT projects — budgets in Rupiah, no middleman.',
            'Outsource pekerjaan atau menangkan proyek IT freelance — budget dalam Rupiah, tanpa perantara.'
          )}
          action={
            <Button onClick={editProjectsComposer}>
              {filters.isComposerOpen ? t('Close composer', 'Tutup form') : t('Post project', 'Pasang proyek')}
            </Button>
          }
        />

        {filters.isComposerOpen && (
          <ProjectsPostForm
            values={form}
            saving={storeProjects.isPending}
            onEditProjects={editProjectsForm}
            onSubmitProjects={submitProjects}
            onClearProjects={clearProjectsForm}
          />
        )}

        <BrowseToolbar
          searchValue={filters.search}
          searchPlaceholder={t('Search projects…', 'Cari proyek…')}
          onEditSearch={editProjectsSearch}
          filters={toolbarFilters}
          onEditFilter={editProjectsFilter}
          onClearFilters={clearProjectsFilters}
        />

        <LoadData hideIcon customLoader response={data}>
          {data.isLoading ? (
            <CardGridSkeleton count={6} chips={0} lines={3} />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data.data.map((project) => (
                <ProjectsCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </LoadData>
      </div>
    </AppShell>
  );
}
