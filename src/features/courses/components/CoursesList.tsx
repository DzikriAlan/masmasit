'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Users } from 'lucide-react';

import type { DataCourses } from '@/features/courses/types/coursesTypes';
import { useCoursesControllers } from '@/features/courses/controllers/coursesControllers';

import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { LoadData } from '@/components/load-data';
import { BrowseToolbar } from '@/components/browse-toolbar';
import { CardGridSkeleton } from '@/components/card-skeleton';
import { useLang } from '@/components/language-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TONE_CHIP, TONE_TEXT, toneOf } from '@/shared/lib/tones';
import { cn } from '@/shared/lib/utils';

export default function CoursesList() {
  const { t } = useLang();
  const { fetchCourses } = useCoursesControllers();

  const [filters, setFilters] = useState({
    search: '',
    filter: { level: 'all', price: 'all' },
  });

  const data = useMemo(() => {
    const getPriceLabel = (price: number) =>
      price === 0 ? t('Free', 'Gratis') : `Rp ${(price / 1000).toFixed(0)}K`;

    const getMappedCourse = (course: DataCourses) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      level: course.level,
      category: course.category,
      price: course.price,
      priceLabel: getPriceLabel(course.price),
      coach: course.profiles?.full_name ?? t('Coach', 'Coach'),
      enrolled: course.enrollments?.length ?? 0,
    });

    const getMatchesFilters = (course: ReturnType<typeof getMappedCourse>) => {
      const query = filters.search.trim().toLowerCase();
      if (query && !course.title.toLowerCase().includes(query) && !course.coach.toLowerCase().includes(query)) return false;
      if (filters.filter.level !== 'all' && course.level !== filters.filter.level) return false;
      if (filters.filter.price === 'free' && course.price !== 0) return false;
      if (filters.filter.price === 'paid' && course.price === 0) return false;
      return true;
    };

    const all = (fetchCourses.data ?? []).map(getMappedCourse);
    const list = all.filter(getMatchesFilters);
    const isFiltered = Boolean(filters.search) || filters.filter.level !== 'all' || filters.filter.price !== 'all';

    return {
      data: list,
      levels: Array.from(new Set(all.map((course) => course.level))).sort((a, b) => a.localeCompare(b)),
      isLoading: fetchCourses.isPending,
      isError: fetchCourses.isError,
      isEmpty: !fetchCourses.isPending && !fetchCourses.isError && list.length === 0,
      errorTitle: t('Could not load courses.', 'Gagal memuat kursus.'),
      errorSubtitle: t('Check your connection and try again.', 'Periksa koneksi lalu coba lagi.'),
      emptyTitle: isFiltered
        ? t('No courses match these filters.', 'Tidak ada kursus yang cocok.')
        : t('No courses published yet.', 'Belum ada kursus tersedia.'),
      emptySubtitle: isFiltered
        ? t('Try another level, or clear the filters.', 'Coba level lain, atau hapus filternya.')
        : t('Teach what you know — see "Become a coach" above.', 'Ajarkan yang kamu kuasai — lihat "Jadi coach" di atas.'),
    };
  }, [fetchCourses.data, fetchCourses.isPending, fetchCourses.isError, filters, t]);

  const toolbarFilters = useMemo(
    () => [
      {
        key: 'level',
        label: t('Level', 'Level'),
        value: filters.filter.level,
        options: [
          { value: 'all', label: t('All levels', 'Semua level') },
          ...data.levels.map((level) => ({ value: level, label: level })),
        ],
      },
      {
        key: 'price',
        label: t('Price', 'Harga'),
        value: filters.filter.price,
        options: [
          { value: 'all', label: t('Any price', 'Semua harga') },
          { value: 'free', label: t('Free', 'Gratis') },
          { value: 'paid', label: t('Paid', 'Berbayar') },
        ],
      },
    ],
    [filters.filter, data.levels, t]
  );

  const editCoursesSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  };

  const editCoursesFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, filter: { ...prev.filter, [key]: value } }));
  };

  const clearCoursesFilters = () => {
    setFilters({ search: '', filter: { level: 'all', price: 'all' } });
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow={t('Ecosystem · Talent', 'Ekosistem · Talent')}
          tone={toneOf('courses')}
          title={t('Courses', 'Kursus')}
          subtitle={t(
            'Courses taught by verified Indonesian IT practitioners, with a certificate on completion.',
            'Kursus dari praktisi IT Indonesia terverifikasi, dengan sertifikat setelah selesai.'
          )}
          action={
            <Link href="/coach">
              <Button variant="outline">{t('Become a coach', 'Jadi coach')}</Button>
            </Link>
          }
        />

        <BrowseToolbar
          searchValue={filters.search}
          searchPlaceholder={t('Search courses or coaches…', 'Cari kursus atau coach…')}
          onEditSearch={editCoursesSearch}
          filters={toolbarFilters}
          onEditFilter={editCoursesFilter}
          onClearFilters={clearCoursesFilters}
        />

        <LoadData hideIcon customLoader response={data}>
          {data.isLoading ? (
            <CardGridSkeleton count={6} chips={2} lines={2} />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data.data.map((course) => (
                <Link
                  key={course.id}
                  href={`/courses/${course.id}`}
                  className="group flex h-full min-w-0 flex-col rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-foreground/25 hover:shadow-[var(--shadow-card-hover)]"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={cn('text-[11px] capitalize', TONE_CHIP[toneOf('courses')])}>
                      {course.level}
                    </Badge>
                    {course.category && (
                      <Badge variant="outline" className="text-[11px]">{course.category}</Badge>
                    )}
                  </div>

                  <h3 className="mt-3 line-clamp-2 font-semibold leading-snug group-hover:underline">{course.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{course.coach}</p>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground text-pretty">
                    {course.description}
                  </p>

                  <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/60 pt-4">
                    <span className={cn('font-semibold', course.price === 0 ? 'text-success' : TONE_TEXT[toneOf('courses')])}>
                      {course.priceLabel}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      {course.enrolled} {t('enrolled', 'terdaftar')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </LoadData>
      </div>
    </AppShell>
  );
}
