'use client';

import Link from 'next/link';
import { Award } from 'lucide-react';

import { useLang } from '@/components/language-provider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

import type { DataActivityCourse } from '@/features/activity/types/activityTypes';
import { ActivityPanel } from '@/features/activity/components/ActivityPanel';

interface Props {
  courses: DataActivityCourse[];
  isLoading: boolean;
  isError: boolean;
}

/** My Courses: progress plus certificate status per course (TC-07-05). */
export function ActivityCourses({ courses, isLoading, isError }: Props) {
  const { t } = useLang();

  return (
    <ActivityPanel
      title={t('My Courses', 'Kursus Saya')}
      description={t('Your progress and certificates.', 'Progres dan sertifikat Anda.')}
      isLoading={isLoading}
      isError={isError}
      isEmpty={courses.length === 0}
      emptyTitle={t('You are not enrolled in any course yet.', 'Anda belum terdaftar di kursus manapun.')}
    >
      {courses.map((en) => {
        const isUnpaid = en.payment_status !== 'paid' && Boolean(en.courses && en.courses.price > 0);
        const isComplete = en.progress >= 100;
        const certificateLabel = en.certificateIssuedAt
          ? `${t('Certificate issued', 'Sertifikat terbit')} · ${new Date(en.certificateIssuedAt).toLocaleDateString('id-ID')}`
          : isComplete
            ? t('Certificate ready to claim', 'Sertifikat siap diklaim')
            : t('Certificate after 100% progress', 'Sertifikat setelah progres 100%');
        return (
          <div key={en.id} className="rounded-lg border border-border/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link href={en.courses ? `/courses/${en.courses.id}` : '/courses'} className="font-medium hover:underline">
                {en.courses?.title ?? t('Course removed', 'Kursus dihapus')}
              </Link>
              <div className="flex items-center gap-2">
                {isUnpaid && <Badge variant="outline" className="text-xs">{t('Unpaid', 'Belum bayar')}</Badge>}
                {isComplete && <Badge variant="default" className="text-xs">{t('Complete', 'Selesai')}</Badge>}
              </div>
            </div>
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>{t('Progress', 'Progres')}</span>
                <span>{en.progress}%</span>
              </div>
              <Progress value={en.progress} className="h-2" />
            </div>
            <p className={`mt-3 flex items-center gap-1.5 text-xs ${en.certificateIssuedAt ? 'text-success' : 'text-muted-foreground'}`}>
              <Award className="h-3.5 w-3.5" /> {certificateLabel}
            </p>
          </div>
        );
      })}
    </ActivityPanel>
  );
}
