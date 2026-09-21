'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { MapPin } from 'lucide-react';

import type { DataDirectory } from '@/features/directory/types/directoryTypes';
import { useDirectoryControllers } from '@/features/directory/controllers/directoryControllers';
import { DIRECTORY_PAGE_SIZE } from '@/features/directory/services/directoryServices';

import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { LoadData } from '@/components/load-data';
import { BrowseToolbar } from '@/components/browse-toolbar';
import { CardGridSkeleton } from '@/components/card-skeleton';
import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { signedOutState } from '@/shared/lib/browse-gate';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TONE_CHIP, toneOf } from '@/shared/lib/tones';
import { cn } from '@/shared/lib/utils';

type DirectoryMember = DataDirectory;

const dummyMembers: DirectoryMember[] = [
  { id: 'dummy-m1', full_name: 'Andi Pratama', bio: 'Full-Stack Developer specializing in Next.js and PostgreSQL. Building SaaS products for the Indonesian market.', avatar_url: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&h=200&w=200', location: 'Jakarta', current_job_status: 'Employed', user_skills: [{ level: 'expert', skills: { name: 'React' } }, { level: 'expert', skills: { name: 'Node.js' } }, { level: 'intermediate', skills: { name: 'PostgreSQL' } }], _isDummy: true } as any,
  { id: 'dummy-m2', full_name: 'Maya Anggraini', bio: 'UI/UX Designer & Frontend Developer. Passionate about creating accessible and beautiful digital experiences.', avatar_url: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&h=200&w=200', location: 'Bandung', current_job_status: 'Freelancing', user_skills: [{ level: 'expert', skills: { name: 'Figma' } }, { level: 'intermediate', skills: { name: 'React' } }, { level: 'beginner', skills: { name: 'TailwindCSS' } }], _isDummy: true } as any,
  { id: 'dummy-m3', full_name: 'Reza Kurniawan', bio: 'DevOps Engineer with a passion for automation. AWS Certified Solutions Architect. Docker & Kubernetes enthusiast.', avatar_url: 'https://images.pexels.com/photos/3777943/pexels-photo-3777943.jpeg?auto=compress&cs=tinysrgb&h=200&w=200', location: 'Surabaya', current_job_status: 'Open to opportunities', user_skills: [{ level: 'expert', skills: { name: 'Docker' } }, { level: 'expert', skills: { name: 'Kubernetes' } }, { level: 'intermediate', skills: { name: 'AWS' } }], _isDummy: true } as any,
  { id: 'dummy-m4', full_name: 'Putri Maharani', bio: 'Data Scientist & ML Engineer. Building predictive models and data pipelines. Python, TensorFlow, and BigQuery.', avatar_url: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&h=200&w=200', location: 'Yogyakarta', current_job_status: 'Employed', user_skills: [{ level: 'expert', skills: { name: 'Python' } }, { level: 'intermediate', skills: { name: 'TensorFlow' } }, { level: 'intermediate', skills: { name: 'SQL' } }], _isDummy: true } as any,
  { id: 'dummy-m5', full_name: 'Bayu Setiawan', bio: 'Mobile Developer (Flutter & Kotlin). 5 years building production apps with millions of downloads.', avatar_url: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&h=200&w=200', location: 'Medan', current_job_status: 'Looking for work', user_skills: [{ level: 'expert', skills: { name: 'Flutter' } }, { level: 'intermediate', skills: { name: 'Kotlin' } }], _isDummy: true } as any,
  { id: 'dummy-m6', full_name: 'Citra Dewi', bio: 'Product Manager transitioning from software engineering. Building products that solve real Indonesian problems.', avatar_url: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&h=200&w=200', location: 'Bali', current_job_status: 'Employed', user_skills: [{ level: 'intermediate', skills: { name: 'Product Management' } }, { level: 'beginner', skills: { name: 'React' } }], _isDummy: true } as any,
];

const LOCATIONS = ['Jakarta', 'Bandung', 'Surabaya', 'Yogyakarta', 'Medan', 'Makassar', 'Bali', 'Online'];
const STATUSES = ['Employed', 'Freelancing', 'Looking for work', 'Open to opportunities', 'Student'];

export default function DirectoryList() {
  const { t } = useLang();
  const { user, loading: authLoading } = useAuth();
  const { fetchDirectory, fetchDirectorySkills, setGetDirectory } = useDirectoryControllers();

  const [filters, setFilters] = useState({
    search: '',
    filter: { location: 'all', status: 'all', skill: 'all' },
    pagination: { currentPage: 1, perPage: DIRECTORY_PAGE_SIZE },
  });

  const data = useMemo(() => {
    const isFiltered =
      Boolean(filters.search) ||
      filters.filter.location !== 'all' ||
      filters.filter.status !== 'all' ||
      filters.filter.skill !== 'all';

    // The seeded profiles only stand in for a first, unfiltered page — never
    // for a search that genuinely returned nothing.
    const getMergedMembers = (dbMembers: DirectoryMember[]) => {
      if (filters.pagination.currentPage !== 1 || isFiltered) return dbMembers;
      const realIds = new Set(dbMembers.map((member) => member.id));
      return [...dbMembers, ...dummyMembers.filter((dummy) => !realIds.has(dummy.id))];
    };

    const getMappedMember = (member: DirectoryMember) => ({
      id: member.id,
      name: member.full_name ?? t('Anonymous', 'Anonim'),
      bio: member.bio,
      avatarUrl: member.avatar_url,
      initial: (member.full_name ?? '?').charAt(0).toUpperCase(),
      location: member.location,
      status: member.current_job_status,
      skills: (member.user_skills ?? []).slice(0, 3).map((entry) => entry.skills?.name).filter(Boolean) as string[],
      extraSkills: Math.max((member.user_skills?.length ?? 0) - 3, 0),
      isTalent: member.is_talent && member.talent_approved === 'approved',
    });

    const rows = fetchDirectory.data ?? [];
    const list = getMergedMembers(rows).map(getMappedMember);

    return {
      data: list,
      isLoading: fetchDirectory.isPending,
      isError: fetchDirectory.isError,
      ...signedOutState(!authLoading && !user, t, t('members', 'member')),
      isEmpty: !fetchDirectory.isPending && !fetchDirectory.isError && list.length === 0,
      errorTitle: t('Could not load members.', 'Gagal memuat member.'),
      errorSubtitle: t('Check your connection and try again.', 'Periksa koneksi lalu coba lagi.'),
      emptyTitle: isFiltered
        ? t('No members match these filters.', 'Tidak ada member yang cocok.')
        : t('No members listed yet.', 'Belum ada member terdaftar.'),
      emptySubtitle: isFiltered
        ? t('Try a different skill or city.', 'Coba skill atau kota lain.')
        : t('Profiles appear here once members complete onboarding.', 'Profil muncul di sini setelah member menyelesaikan onboarding.'),
      pagination: filters.pagination,
      hasNextPage: rows.length === DIRECTORY_PAGE_SIZE,
    };
  }, [fetchDirectory.data, fetchDirectory.isPending, fetchDirectory.isError, filters, t, user, authLoading]);

  const toolbarFilters = useMemo(
    () => [
      {
        key: 'location',
        label: t('Location', 'Lokasi'),
        value: filters.filter.location,
        options: [
          { value: 'all', label: t('All locations', 'Semua lokasi') },
          ...LOCATIONS.map((location) => ({ value: location, label: location })),
        ],
      },
      {
        key: 'status',
        label: t('Status', 'Status'),
        value: filters.filter.status,
        width: 'sm:w-52',
        options: [
          { value: 'all', label: t('Any status', 'Semua status') },
          ...STATUSES.map((status) => ({ value: status, label: status })),
        ],
      },
      {
        key: 'skill',
        label: t('Skill', 'Skill'),
        value: filters.filter.skill,
        options: [
          { value: 'all', label: t('All skills', 'Semua skill') },
          ...(fetchDirectorySkills.data ?? []).map((skill) => ({ value: skill.id, label: skill.name })),
        ],
      },
    ],
    [filters.filter, fetchDirectorySkills.data, t]
  );

  const editDirectorySearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value, pagination: { ...prev.pagination, currentPage: 1 } }));
  };

  const editDirectoryFilter = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      filter: { ...prev.filter, [key]: value },
      pagination: { ...prev.pagination, currentPage: 1 },
    }));
  };

  const clearDirectoryFilters = () => {
    setFilters((prev) => ({
      ...prev,
      search: '',
      filter: { location: 'all', status: 'all', skill: 'all' },
      pagination: { ...prev.pagination, currentPage: 1 },
    }));
  };

  const loadDirectory = (page: number) => {
    setFilters((prev) => ({ ...prev, pagination: { ...prev.pagination, currentPage: page } }));
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      setGetDirectory({
        search: filters.search,
        locationFilter: filters.filter.location,
        statusFilter: filters.filter.status,
        skillFilter: filters.filter.skill,
        page: filters.pagination.currentPage,
      });
    }, 300);
    return () => clearTimeout(timeout);
  }, [filters, setGetDirectory]);

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow={t('Ecosystem · Community', 'Ekosistem · Komunitas')}
          tone={toneOf('directory')}
          title={t('Members', 'Member')}
          subtitle={t('Connect with IT practitioners across Indonesia.', 'Terhubung dengan praktisi IT di seluruh Indonesia.')}
        />

        <BrowseToolbar
          searchValue={filters.search}
          searchPlaceholder={t('Search by name or bio…', 'Cari nama atau bio…')}
          onEditSearch={editDirectorySearch}
          filters={toolbarFilters}
          onEditFilter={editDirectoryFilter}
          onClearFilters={clearDirectoryFilters}
        />

        <LoadData hideIcon customLoader response={data}>
          {data.isLoading ? (
            <CardGridSkeleton count={6} chips={3} lines={2} />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data.data.map((member) => (
                <Link
                  key={member.id}
                  href={`/directory/${member.id}`}
                  className="group flex h-full min-w-0 flex-col rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-foreground/25 hover:shadow-[var(--shadow-card-hover)]"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12 shrink-0">
                      {member.avatarUrl && <AvatarImage src={member.avatarUrl} alt="" />}
                      <AvatarFallback className={TONE_CHIP[toneOf('directory')]}>{member.initial}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="min-w-0 flex-1 truncate font-semibold group-hover:underline">{member.name}</h3>
                        {member.isTalent && (
                          <Badge variant="outline" className={cn('shrink-0 text-[11px]', TONE_CHIP[toneOf('talents')])}>
                            {t('Talent', 'Talent')}
                          </Badge>
                        )}
                      </div>
                      {member.location && (
                        <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {member.location}
                        </p>
                      )}
                    </div>
                  </div>

                  {member.bio && (
                    <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground text-pretty">{member.bio}</p>
                  )}

                  {member.skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {member.skills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-[11px]">{skill}</Badge>
                      ))}
                      {member.extraSkills > 0 && (
                        <Badge variant="outline" className="text-[11px]">+{member.extraSkills}</Badge>
                      )}
                    </div>
                  )}

                  {member.status && <p className="mt-auto pt-4 text-xs text-muted-foreground">{member.status}</p>}
                </Link>
              ))}
            </div>
          )}
        </LoadData>

        {!data.isLoading && (data.pagination.currentPage > 1 || data.hasNextPage) && (
          <nav className="mt-10 flex items-center justify-center gap-3" aria-label={t('Pagination', 'Paginasi')}>
            <Button
              variant="outline"
              disabled={data.pagination.currentPage === 1}
              onClick={() => loadDirectory(data.pagination.currentPage - 1)}
            >
              {t('Previous', 'Sebelumnya')}
            </Button>
            <span className="text-sm text-muted-foreground">
              {t('Page', 'Halaman')} {data.pagination.currentPage}
            </span>
            <Button
              variant="outline"
              disabled={!data.hasNextPage}
              onClick={() => loadDirectory(data.pagination.currentPage + 1)}
            >
              {t('Next', 'Berikutnya')}
            </Button>
          </nav>
        )}
      </div>
    </AppShell>
  );
}
