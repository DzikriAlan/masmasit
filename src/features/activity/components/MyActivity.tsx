'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

import { AppShell } from '@/components/app-shell';
import { LoadData } from '@/components/load-data';
import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { ACTIVITY_TABS, type ActivityTab, type PayloadPostActivityRequestPayment } from '@/features/activity/types/activityTypes';
import { useActivityControllers } from '@/features/activity/controllers/activityControllers';
import { ActivityApplications } from '@/features/activity/components/ActivityApplications';
import { ActivityBookings } from '@/features/activity/components/ActivityBookings';
import { ActivityCourses } from '@/features/activity/components/ActivityCourses';
import { ActivityEvents } from '@/features/activity/components/ActivityEvents';
import { ActivityJobs } from '@/features/activity/components/ActivityJobs';
import { ActivityProjects } from '@/features/activity/components/ActivityProjects';
import { ActivityRequests } from '@/features/activity/components/ActivityRequests';
import { ActivityTeams } from '@/features/activity/components/ActivityTeams';
import { useJobsMyApplicationsControllers } from '@/features/jobs/controllers/jobsControllers';
import { useTalentsBookingsControllers } from '@/features/talents/controllers/talentsControllers';
import { useReviewsBookingControllers } from '@/features/reviews/controllers/reviewsControllers';
import { loginHref } from '@/shared/lib/utils';

/**
 * Everything the member takes part in, one tab per area. A tab only shows
 * when the member has something in it or holds the matching role (TC-12-03);
 * `?tab=` selects one directly (e.g. /activity?tab=requests).
 */
function MyActivityContent() {
  const { user, profile, roles, loading } = useAuth();
  const { t } = useLang();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { fetchJobsMyApplications } = useJobsMyApplicationsControllers(user?.id);
  const { fetchTalentsBookings, fetchTalentsMyBookings, changeTalentsBookingStatus } =
    useTalentsBookingsControllers(user?.id);
  const {
    fetchActivityCourses,
    fetchActivityProjects,
    fetchActivityEvents,
    fetchActivityTeams,
    fetchActivityRequests,
    fetchActivityJobs,
    storeActivityRequestPayment,
  } = useActivityControllers(user?.id);
  const { fetchReviewsBookingMine, storeReviewsBooking } = useReviewsBookingControllers(user?.id);

  const [filters, setFilters] = useState<{ tab: ActivityTab | null }>({ tab: null });

  const data = useMemo(() => {
    const applications = fetchJobsMyApplications.data ?? [];
    const courses = fetchActivityCourses.data ?? [];
    const incomingBookings = fetchTalentsBookings.data ?? [];
    const myBookings = fetchTalentsMyBookings.data ?? [];
    const projects = fetchActivityProjects.data ?? { posted: [], bids: [] };
    const events = fetchActivityEvents.data ?? [];
    const teams = fetchActivityTeams.data ?? { owned: [], joined: [], collabs: [] };
    const requests = fetchActivityRequests.data ?? { requests: [], fallbackUrl: null };
    const jobs = fetchActivityJobs.data ?? { company: null, jobs: [] };
    const myRatings = Object.fromEntries((fetchReviewsBookingMine.data ?? []).map((r) => [r.booking_id, r.rating]));

    const isTalent = Boolean(profile?.is_talent);
    const visible: Record<ActivityTab, boolean> = {
      applications: applications.length > 0,
      courses: courses.length > 0,
      bookings: incomingBookings.length > 0 || myBookings.length > 0 || isTalent,
      projects: projects.posted.length > 0 || projects.bids.length > 0,
      events: events.length > 0,
      teams: teams.owned.length + teams.joined.length + teams.collabs.length > 0,
      requests: requests.requests.length > 0 || roles.includes('client'),
      jobs: Boolean(jobs.company) || roles.includes('company'),
    };
    const tabs = ACTIVITY_TABS.filter((tab) => visible[tab]);

    const isLoading =
      loading ||
      fetchJobsMyApplications.isPending ||
      fetchActivityCourses.isPending ||
      fetchTalentsBookings.isPending ||
      fetchTalentsMyBookings.isPending ||
      fetchActivityProjects.isPending ||
      fetchActivityEvents.isPending ||
      fetchActivityTeams.isPending ||
      fetchActivityRequests.isPending ||
      fetchActivityJobs.isPending;

    const requestedTab = searchParams.get('tab') as ActivityTab | null;
    const getActiveTab = () => {
      if (filters.tab && tabs.includes(filters.tab)) return filters.tab;
      if (requestedTab && tabs.includes(requestedTab)) return requestedTab;
      return tabs[0] ?? null;
    };

    return {
      applications,
      courses,
      incomingBookings,
      myBookings,
      projects,
      events,
      teams,
      requests,
      jobs,
      myRatings,
      tabs,
      activeTab: getActiveTab(),
      isLoading,
      isEmpty: !isLoading && tabs.length === 0,
      labels: {
        applications: t('Applications', 'Lamaran'),
        courses: t('My Courses', 'Kursus Saya'),
        bookings: t('Bookings', 'Booking'),
        projects: t('Projects', 'Proyek'),
        events: t('Events', 'Event'),
        teams: t('Teams', 'Tim'),
        requests: t('Requests', 'Permintaan'),
        jobs: t('Jobs', 'Lowongan'),
      } as Record<ActivityTab, string>,
    };
  }, [
    t,
    loading,
    profile?.is_talent,
    roles,
    searchParams,
    filters.tab,
    fetchJobsMyApplications.data,
    fetchJobsMyApplications.isPending,
    fetchActivityCourses.data,
    fetchActivityCourses.isPending,
    fetchTalentsBookings.data,
    fetchTalentsBookings.isPending,
    fetchTalentsMyBookings.data,
    fetchTalentsMyBookings.isPending,
    fetchActivityProjects.data,
    fetchActivityProjects.isPending,
    fetchActivityEvents.data,
    fetchActivityEvents.isPending,
    fetchActivityTeams.data,
    fetchActivityTeams.isPending,
    fetchActivityRequests.data,
    fetchActivityRequests.isPending,
    fetchActivityJobs.data,
    fetchActivityJobs.isPending,
    fetchReviewsBookingMine.data,
  ]);

  const loadTab = (tab: string) => {
    setFilters((prev) => ({ ...prev, tab: tab as ActivityTab }));
    router.replace(`${pathname}?tab=${tab}`, { scroll: false });
  };

  const editBookingStatus = async (bookingId: string, status: string) => {
    try {
      await changeTalentsBookingStatus.mutateAsync({ bookingId, status });
    } catch {
      toast.error(t('Failed to update booking', 'Gagal memperbarui booking'));
    }
  };

  const submitBookingReview = async (
    booking: { bookingId: string; talentId: string },
    review: { rating: number; comment: string }
  ) => {
    if (!user) return;
    try {
      await storeReviewsBooking.mutateAsync({
        booking_id: booking.bookingId,
        reviewer_id: user.id,
        talent_id: booking.talentId,
        rating: review.rating,
        comment: review.comment || null,
      });
    } catch {
      toast.error(t('Failed to submit review', 'Gagal mengirim ulasan'));
      return;
    }
    toast.success(t('Thanks for your review!', 'Terima kasih atas ulasan Anda!'));
  };

  const submitRequestPayment = async (payload: PayloadPostActivityRequestPayment) => {
    try {
      await storeActivityRequestPayment.mutateAsync(payload);
    } catch {
      toast.error(t('Failed to submit confirmation', 'Gagal mengirim konfirmasi'));
      return;
    }
    toast.success(t('Payment confirmation submitted! Admin will verify shortly.', 'Konfirmasi pembayaran dikirim! Admin akan segera memverifikasi.'));
  };

  useEffect(() => {
    if (!loading && !user) router.push(loginHref());
  }, [loading, user, router]);

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold">{t('My Activity', 'Aktivitas Saya')}</h1>
          <p className="mt-1 text-muted-foreground">
            {t('Everything you have applied to, enrolled in, booked, posted or joined.', 'Semua yang Anda lamar, ikuti, pesan, pasang, atau gabungi.')}
          </p>
        </div>

        <LoadData
          minHeight="30vh"
          response={{
            isLoading: data.isLoading,
            isEmpty: data.isEmpty,
            emptyTitle: t('Nothing here yet.', 'Belum ada aktivitas.'),
            emptySubtitle: t('Apply to a job, join a course or bid on a project to see it here.', 'Lamar kerja, ikuti kursus, atau ajukan bid proyek agar muncul di sini.'),
          }}
        >
          {data.activeTab && (
            <Tabs value={data.activeTab} onValueChange={loadTab}>
              <TabsList className="mb-6 h-auto flex-wrap justify-start">
                {data.tabs.map((tab) => (
                  <TabsTrigger key={tab} value={tab}>{data.labels[tab]}</TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="applications">
                <ActivityApplications applications={data.applications} isLoading={false} />
              </TabsContent>

              <TabsContent value="courses">
                <ActivityCourses courses={data.courses} isLoading={false} isError={fetchActivityCourses.isError} />
              </TabsContent>

              <TabsContent value="bookings">
                <ActivityBookings
                  incomingBookings={data.incomingBookings}
                  myBookings={data.myBookings}
                  isLoading={false}
                  myRatings={data.myRatings}
                  reviewing={storeReviewsBooking.isPending}
                  onEditBookingStatus={editBookingStatus}
                  onSubmitBookingReview={submitBookingReview}
                />
              </TabsContent>

              <TabsContent value="projects">
                <ActivityProjects projects={data.projects} isLoading={false} isError={fetchActivityProjects.isError} />
              </TabsContent>

              <TabsContent value="events">
                <ActivityEvents rsvps={data.events} isLoading={false} isError={fetchActivityEvents.isError} />
              </TabsContent>

              <TabsContent value="teams">
                <ActivityTeams teams={data.teams} isLoading={false} isError={fetchActivityTeams.isError} />
              </TabsContent>

              <TabsContent value="requests">
                <ActivityRequests
                  requests={data.requests}
                  isLoading={false}
                  isError={fetchActivityRequests.isError}
                  submitting={storeActivityRequestPayment.isPending}
                  onSubmitPayment={submitRequestPayment}
                />
              </TabsContent>

              <TabsContent value="jobs">
                <ActivityJobs jobs={data.jobs} isLoading={false} isError={fetchActivityJobs.isError} />
              </TabsContent>
            </Tabs>
          )}
        </LoadData>

        {data.isEmpty && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link href="/jobs"><Button variant="outline" size="sm">{t('Find Jobs', 'Cari Kerja')}</Button></Link>
            <Link href="/courses"><Button variant="outline" size="sm">{t('Courses', 'Kursus')}</Button></Link>
            <Link href="/projects"><Button variant="outline" size="sm">{t('Projects', 'Proyek')}</Button></Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}

// useSearchParams needs a Suspense boundary for the static build.
export default function MyActivity() {
  return (
    <Suspense fallback={<LoadData minHeight="60vh" response={{ isLoading: true }} />}>
      <MyActivityContent />
    </Suspense>
  );
}
