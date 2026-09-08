'use client';

import { Loader2, Briefcase, GraduationCap, Star, CalendarClock, Award } from 'lucide-react';
import Link from 'next/link';

import { AppShell } from '@/components/app-shell';
import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

import { useJobsMyApplicationsControllers } from '@/features/jobs/controllers/jobsControllers';
import { useCoursesControllers } from '@/features/courses/controllers/coursesControllers';
import { useTalentsBookingsControllers } from '@/features/talents/controllers/talentsControllers';

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  pending: 'outline',
  reviewing: 'secondary',
  accepted: 'default',
  confirmed: 'default',
  completed: 'default',
  rejected: 'destructive',
  cancelled: 'destructive',
};

/**
 * The "taker" side of the platform in one place: jobs applied to, courses
 * enrolled in, and consultation bookings — both made and received.
 */
export default function MyActivity() {
  const { user, loading } = useAuth();
  const { t } = useLang();

  const { fetchJobsMyApplications } = useJobsMyApplicationsControllers(user?.id);
  const { fetchCoursesMine } = useCoursesControllers(user?.id);
  const { fetchTalentsBookings, fetchTalentsMyBookings, changeTalentsBookingStatus } =
    useTalentsBookingsControllers(user?.id);

  const applications = fetchJobsMyApplications.data ?? [];
  const enrollments = fetchCoursesMine.data ?? [];
  const incomingBookings = fetchTalentsBookings.data ?? [];
  const myBookings = fetchTalentsMyBookings.data ?? [];

  const modifyBookingStatus = async (bookingId: string, status: string) => {
    await changeTalentsBookingStatus.mutateAsync({ bookingId, status });
  };

  if (loading) {
    return <AppShell><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AppShell>;
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold">{t('My Activity', 'Aktivitas Saya')}</h1>
          <p className="mt-1 text-muted-foreground">
            {t('Everything you have applied to, enrolled in, or booked.', 'Semua yang Anda lamar, ikuti, dan pesan.')}
          </p>
        </div>

        <Tabs defaultValue="applications">
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="applications">{t('Applications', 'Lamaran')}</TabsTrigger>
            <TabsTrigger value="courses">{t('My Courses', 'Kursus Saya')}</TabsTrigger>
            <TabsTrigger value="bookings">{t('Bookings', 'Booking')}</TabsTrigger>
          </TabsList>

          <TabsContent value="applications">
            <Card className="glass">
              <CardHeader>
                <CardTitle>{t('Job Applications', 'Lamaran Kerja')}</CardTitle>
                <CardDescription>{t('Track where each application stands.', 'Pantau status setiap lamaran.')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {fetchJobsMyApplications.isPending ? (
                  <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                ) : applications.length === 0 ? (
                  <div className="py-10 text-center text-muted-foreground">
                    <Briefcase className="mx-auto mb-3 h-10 w-10 opacity-50" />
                    <p className="text-sm">{t('You have not applied to any jobs yet.', 'Anda belum melamar pekerjaan.')}</p>
                  </div>
                ) : (
                  applications.map((app) => (
                    <div key={app.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 p-4">
                      <div className="min-w-0">
                        <Link href={app.jobs ? `/jobs/${app.jobs.id}` : '/jobs'} className="font-medium hover:underline">
                          {app.jobs?.title ?? t('Job removed', 'Lowongan dihapus')}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {app.jobs?.companies?.name ?? '—'}
                          {app.jobs?.location ? ` · ${app.jobs.location}` : ''} ·{' '}
                          {new Date(app.created_at).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                      <Badge variant={STATUS_VARIANT[app.status] ?? 'outline'} className="capitalize">{app.status}</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="courses">
            <Card className="glass">
              <CardHeader>
                <CardTitle>{t('My Courses', 'Kursus Saya')}</CardTitle>
                <CardDescription>{t('Your progress and certificates.', 'Progres dan sertifikat Anda.')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {fetchCoursesMine.isPending ? (
                  <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                ) : enrollments.length === 0 ? (
                  <div className="py-10 text-center text-muted-foreground">
                    <GraduationCap className="mx-auto mb-3 h-10 w-10 opacity-50" />
                    <p className="text-sm">{t('You are not enrolled in any course yet.', 'Anda belum terdaftar di kursus manapun.')}</p>
                  </div>
                ) : (
                  enrollments.map((en) => (
                    <div key={en.id} className="rounded-lg border border-border/60 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <Link href={en.courses ? `/courses/${en.courses.id}` : '/courses'} className="font-medium hover:underline">
                          {en.courses?.title ?? t('Course removed', 'Kursus dihapus')}
                        </Link>
                        <div className="flex items-center gap-2">
                          {en.payment_status !== 'paid' && en.courses && en.courses.price > 0 && (
                            <Badge variant="outline" className="text-xs">{t('Unpaid', 'Belum bayar')}</Badge>
                          )}
                          {en.progress >= 100 && (
                            <Badge variant="default" className="gap-1 text-xs"><Award className="h-3 w-3" /> {t('Complete', 'Selesai')}</Badge>
                          )}
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                          <span>{t('Progress', 'Progres')}</span>
                          <span>{en.progress}%</span>
                        </div>
                        <Progress value={en.progress} className="h-2" />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-6">
            <Card className="glass">
              <CardHeader>
                <CardTitle>{t('Booking Requests', 'Permintaan Booking')}</CardTitle>
                <CardDescription>
                  {t('Sessions clients booked with you. Accept or decline them here.', 'Sesi yang dipesan klien kepada Anda. Terima atau tolak di sini.')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {incomingBookings.length === 0 ? (
                  <div className="py-10 text-center text-muted-foreground">
                    <Star className="mx-auto mb-3 h-10 w-10 opacity-50" />
                    <p className="text-sm">{t('No incoming bookings.', 'Belum ada booking masuk.')}</p>
                  </div>
                ) : (
                  incomingBookings.map((b) => (
                    <div key={b.id} className="rounded-lg border border-border/60 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium capitalize">{b.booking_type}</p>
                          <p className="text-xs text-muted-foreground">
                            {b.profiles?.full_name ?? b.client_name ?? t('External client', 'Klien eksternal')} ·{' '}
                            {new Date(b.scheduled_at).toLocaleString('id-ID')}
                          </p>
                        </div>
                        <Badge variant={STATUS_VARIANT[b.status] ?? 'outline'} className="capitalize">{b.status}</Badge>
                      </div>
                      {b.notes && <p className="mt-2 rounded-md bg-muted/40 p-3 text-sm">{b.notes}</p>}
                      {b.status === 'pending' && (
                        <div className="mt-3 flex gap-2">
                          <Button size="sm" onClick={() => modifyBookingStatus(b.id, 'confirmed')}>{t('Accept', 'Terima')}</Button>
                          <Button size="sm" variant="outline" onClick={() => modifyBookingStatus(b.id, 'cancelled')}>{t('Decline', 'Tolak')}</Button>
                        </div>
                      )}
                      {b.status === 'confirmed' && (
                        <Button size="sm" variant="outline" className="mt-3" onClick={() => modifyBookingStatus(b.id, 'completed')}>
                          {t('Mark completed', 'Tandai selesai')}
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle>{t('Sessions You Booked', 'Sesi yang Anda Pesan')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {myBookings.length === 0 ? (
                  <div className="py-10 text-center text-muted-foreground">
                    <CalendarClock className="mx-auto mb-3 h-10 w-10 opacity-50" />
                    <p className="text-sm">{t('You have not booked any session.', 'Anda belum memesan sesi.')}</p>
                  </div>
                ) : (
                  myBookings.map((b) => (
                    <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 p-4">
                      <div>
                        <p className="font-medium">{b.profiles?.full_name ?? t('Talent', 'Talent')}</p>
                        <p className="text-xs text-muted-foreground">
                          <span className="capitalize">{b.booking_type}</span> · {new Date(b.scheduled_at).toLocaleString('id-ID')}
                        </p>
                      </div>
                      <Badge variant={STATUS_VARIANT[b.status] ?? 'outline'} className="capitalize">{b.status}</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
