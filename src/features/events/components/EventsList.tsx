'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarDays, CheckCircle2, Loader2, MapPin, Users } from 'lucide-react';
import { toast } from 'sonner';

import type { DataEvents } from '@/features/events/types/eventsTypes';
import { useEventsControllers } from '@/features/events/controllers/eventsControllers';
import { EventsCard } from '@/features/events/components/EventsCard';
import { EventsCreateForm, type EventsFormValues } from '@/features/events/components/EventsCreateForm';
import { PaymentCard } from '@/features/payments/components/PaymentCard';

import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { LoadData } from '@/components/load-data';
import { BrowseToolbar } from '@/components/browse-toolbar';
import { CardGridSkeleton } from '@/components/card-skeleton';
import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { API_ERROR_CODE } from '@/shared/lib/apiResponse';
import { TONE_CHIP, toneOf } from '@/shared/lib/tones';
import { cn } from '@/shared/lib/utils';

const EMPTY_FORM: EventsFormValues = {
  title: '', description: '', event_type: 'meetup', location: '', event_date: '',
  max_capacity: '50', is_paid: false, price: '0', region_id: '',
};

export default function EventsList() {
  const { user } = useAuth();
  const { t } = useLang();
  const { fetchEvents, fetchEventsRegions, fetchEventsSettings, storeEvents, storeEventsRsvp } = useEventsControllers();

  const [filters, setFilters] = useState({
    search: '',
    filter: { type: 'all', region: 'all' },
    isComposerOpen: false,
    rsvpLoadingId: null as string | null,
    paidRsvp: null as { rsvpId: string; eventId: string; amount: number; paymentStatus: string } | null,
  });
  const [form, setForm] = useState<EventsFormValues>(EMPTY_FORM);

  const data = useMemo(() => {
    const rows = fetchEvents.data ?? [];

    const getRsvpIds = () => {
      const ids = new Set<string>();
      if (!user) return ids;
      rows.forEach((event) => {
        if (event.event_rsvps?.some((rsvp) => rsvp.user_id === user.id)) ids.add(event.id);
      });
      return ids;
    };

    const rsvpIds = getRsvpIds();

    const getMappedEvent = (event: DataEvents) => {
      const attending = event.event_rsvps?.length ?? 0;
      return {
        id: event.id,
        title: event.title,
        description: event.description,
        type: event.event_type,
        regionName: event.regions?.name ?? null,
        location: event.location,
        schedule: new Date(event.event_date).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
        isPaid: event.is_paid,
        priceLabel: event.is_paid && event.price ? `Rp ${(event.price / 1000).toFixed(0)}K` : null,
        attending,
        capacity: event.max_capacity,
        spotsLeft: Math.max(event.max_capacity - attending, 0),
        fillPercent: event.max_capacity ? Math.round((attending / event.max_capacity) * 100) : 0,
        isRegistered: rsvpIds.has(event.id),
      };
    };

    const getMatchesFilters = (event: DataEvents) => {
      const query = filters.search.trim().toLowerCase();
      if (filters.filter.region !== 'all' && event.regions?.name !== filters.filter.region) return false;
      if (filters.filter.type !== 'all' && event.event_type !== filters.filter.type) return false;
      if (query && !event.title.toLowerCase().includes(query) && !event.description.toLowerCase().includes(query)) return false;
      return true;
    };

    const now = Date.now();
    const matched = rows.filter(getMatchesFilters);
    const upcoming = matched.filter((event) => new Date(event.event_date).getTime() > now).map(getMappedEvent);
    const past = matched.filter((event) => new Date(event.event_date).getTime() <= now).map(getMappedEvent);
    const isFiltered = Boolean(filters.search) || filters.filter.type !== 'all' || filters.filter.region !== 'all';

    return {
      data: upcoming,
      featured: upcoming[0] ?? null,
      rest: upcoming.slice(1),
      past: past.slice(0, 6),
      isLoading: fetchEvents.isPending,
      isError: fetchEvents.isError,
      isEmpty: !fetchEvents.isPending && !fetchEvents.isError && upcoming.length === 0 && past.length === 0,
      errorTitle: t('Could not load events.', 'Gagal memuat event.'),
      errorSubtitle: t('Check your connection and try again.', 'Periksa koneksi lalu coba lagi.'),
      emptyTitle: isFiltered
        ? t('No events match these filters.', 'Tidak ada event yang cocok.')
        : t('No events scheduled yet.', 'Belum ada event terjadwal.'),
      emptySubtitle: isFiltered
        ? t('Try another region or type.', 'Coba wilayah atau tipe lain.')
        : t('Host the first meetup in your city.', 'Adakan meetup pertama di kotamu.'),
    };
  }, [fetchEvents.data, fetchEvents.isPending, fetchEvents.isError, filters.search, filters.filter, user, t]);

  const toolbarFilters = useMemo(
    () => [
      {
        key: 'type',
        label: t('Type', 'Tipe'),
        value: filters.filter.type,
        options: [
          { value: 'all', label: t('All types', 'Semua tipe') },
          { value: 'meetup', label: 'Meetup' },
          { value: 'workshop', label: 'Workshop' },
          { value: 'hackathon', label: 'Hackathon' },
          { value: 'conference', label: 'Conference' },
        ],
      },
      {
        key: 'region',
        label: t('Region', 'Wilayah'),
        value: filters.filter.region,
        width: 'sm:w-52',
        options: [
          { value: 'all', label: t('All regions', 'Semua wilayah') },
          ...(fetchEventsRegions.data ?? []).map((region) => ({ value: region.name, label: region.name })),
        ],
      },
    ],
    [filters.filter, fetchEventsRegions.data, t]
  );

  const editEventsSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  };

  const editEventsFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, filter: { ...prev.filter, [key]: value } }));
  };

  const clearEventsFilters = () => {
    setFilters((prev) => ({ ...prev, search: '', filter: { type: 'all', region: 'all' } }));
  };

  const editEventsComposer = () => {
    if (!user) {
      toast.error(t('Please sign in to create an event', 'Silakan masuk untuk membuat event'));
      return;
    }
    setFilters((prev) => ({ ...prev, isComposerOpen: !prev.isComposerOpen }));
  };

  const editEventsForm = (patch: Partial<EventsFormValues>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const clearEventsForm = () => {
    setForm(EMPTY_FORM);
    setFilters((prev) => ({ ...prev, isComposerOpen: false }));
  };

  const clearEventsPayment = () => {
    setFilters((prev) => ({ ...prev, paidRsvp: null }));
  };

  const submitEvents = async () => {
    if (!user) return;

    try {
      await storeEvents.mutateAsync({
        created_by: user.id,
        title: form.title,
        description: form.description,
        event_type: form.event_type,
        location: form.location,
        event_date: new Date(form.event_date).toISOString(),
        max_capacity: Number.parseInt(form.max_capacity, 10) || 50,
        is_paid: form.is_paid,
        price: form.is_paid ? Number.parseInt(form.price, 10) || 0 : null,
        region_id: form.region_id,
      });
    } catch {
      toast.error(t('Failed to create event', 'Gagal membuat event'));
      return;
    }

    toast.success(
      t('Event submitted — an admin reviews it before it goes live.', 'Event terkirim — admin meninjau sebelum tayang.')
    );
    clearEventsForm();
  };

  const submitEventsRsvp = async (eventId: string) => {
    if (!user) {
      toast.error(t('Please sign in to RSVP', 'Silakan masuk untuk RSVP'));
      return;
    }

    setFilters((prev) => ({ ...prev, rsvpLoadingId: eventId }));

    let rsvpId: string | null = null;
    try {
      rsvpId = await storeEventsRsvp.mutateAsync({ event_id: eventId });
    } catch (error) {
      setFilters((prev) => ({ ...prev, rsvpLoadingId: null }));
      const code = error instanceof Error ? error.name : '';
      const message = error instanceof Error ? error.message : '';
      if (code === API_ERROR_CODE.CONFLICT) toast.error(t('Already registered', 'Sudah terdaftar'));
      else if (message.includes('full')) toast.error(t('This event is full', 'Event ini sudah penuh'));
      else toast.error(t('Failed to RSVP', 'Gagal RSVP'));
      return;
    }

    toast.success(t('RSVP confirmed — see you there.', 'RSVP dikonfirmasi — sampai jumpa.'));

    const event = (fetchEvents.data ?? []).find((item) => item.id === eventId);
    setFilters((prev) => ({
      ...prev,
      rsvpLoadingId: null,
      paidRsvp:
        event?.is_paid && event.price && rsvpId
          ? { rsvpId, eventId, amount: event.price, paymentStatus: 'unpaid' }
          : null,
    }));
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow={t('Ecosystem · Community', 'Ekosistem · Komunitas')}
          tone={toneOf('events')}
          title={t('Events', 'Event')}
          subtitle={t(
            'Meetups, workshops and hackathons run by the community, region by region.',
            'Meetup, workshop, dan hackathon dari komunitas, per wilayah.'
          )}
          action={
            <Button onClick={editEventsComposer}>
              {filters.isComposerOpen ? t('Close', 'Tutup') : t('Host an event', 'Adakan event')}
            </Button>
          }
        />

        {filters.isComposerOpen && (
          <EventsCreateForm
            values={form}
            regions={fetchEventsRegions.data ?? []}
            saving={storeEvents.isPending}
            onEditEvents={editEventsForm}
            onSubmitEvents={submitEvents}
            onClearEvents={clearEventsForm}
          />
        )}

        <BrowseToolbar
          searchValue={filters.search}
          searchPlaceholder={t('Search events…', 'Cari event…')}
          onEditSearch={editEventsSearch}
          filters={toolbarFilters}
          onEditFilter={editEventsFilter}
          onClearFilters={clearEventsFilters}
        />

        <LoadData hideIcon customLoader response={data}>
          {data.isLoading ? (
            <CardGridSkeleton count={6} chips={2} lines={2} />
          ) : (
            <div className="space-y-10">
              {data.featured && (
                <section
                  aria-label={t('Next event', 'Event berikutnya')}
                  className="rounded-2xl border border-border bg-secondary/40 p-6 sm:p-8"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={cn('text-[11px]', TONE_CHIP[toneOf('events')])} variant="outline">
                      {t('Next up', 'Paling dekat')}
                    </Badge>
                    <Badge variant="outline" className="text-[11px] capitalize">{data.featured.type}</Badge>
                    {data.featured.regionName && (
                      <Badge variant="outline" className="text-[11px]">{data.featured.regionName}</Badge>
                    )}
                  </div>

                  <h2 className="mt-3 font-display text-2xl font-semibold text-balance sm:text-3xl">
                    {data.featured.title}
                  </h2>
                  <p className="mt-2 max-w-2xl leading-relaxed text-muted-foreground text-pretty">
                    {data.featured.description}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{data.featured.schedule}</span>
                    <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{data.featured.location}</span>
                    <span className="flex items-center gap-1.5"><Users className="h-4 w-4" />{data.featured.attending}/{data.featured.capacity}</span>
                  </div>

                  <div className="mt-5">
                    {data.featured.isRegistered ? (
                      <p className="flex items-center gap-1.5 text-sm font-medium text-success">
                        <CheckCircle2 className="h-4 w-4" />
                        {t('Registered', 'Terdaftar')}
                      </p>
                    ) : (
                      <Button
                        className="gap-2"
                        disabled={filters.rsvpLoadingId === data.featured.id || data.featured.spotsLeft <= 0}
                        onClick={() => submitEventsRsvp(data.featured?.id ?? '')}
                      >
                        {filters.rsvpLoadingId === data.featured.id && <Loader2 className="h-4 w-4 animate-spin" />}
                        {data.featured.spotsLeft > 0 ? t('RSVP now', 'RSVP sekarang') : t('Sold out', 'Penuh')}
                      </Button>
                    )}
                  </div>
                </section>
              )}

              {data.rest.length > 0 && (
                <section>
                  <h2 className="mb-4 font-display text-xl font-semibold">
                    {t('Upcoming', 'Mendatang')} <span className="text-muted-foreground">({data.data.length})</span>
                  </h2>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {data.rest.map((event) => (
                      <EventsCard
                        key={event.id}
                        event={event}
                        isSubmitting={filters.rsvpLoadingId === event.id}
                        onSubmitRsvp={submitEventsRsvp}
                      />
                    ))}
                  </div>
                </section>
              )}

              {data.past.length > 0 && (
                <section>
                  <h2 className="mb-4 font-display text-xl font-semibold text-muted-foreground">
                    {t('Past events', 'Event sebelumnya')}
                  </h2>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {data.past.map((event) => (
                      <div key={event.id} className="rounded-xl border border-border/70 bg-card/50 p-5">
                        <Badge variant="outline" className="text-[11px]">{t('Ended', 'Selesai')}</Badge>
                        <h3 className="mt-2.5 line-clamp-2 font-medium leading-snug">{event.title}</h3>
                        <p className="mt-1 truncate text-sm text-muted-foreground">{event.location}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {event.attending} {t('attended', 'hadir')}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </LoadData>

        {!user && !data.isLoading && (
          <section className="mt-12 rounded-2xl border border-border bg-secondary/40 p-6 text-center sm:p-8">
            <h2 className="font-display text-xl font-semibold">{t('Want to host an event?', 'Ingin mengadakan event?')}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              {t('Join the community and start organising meetups in your region.', 'Gabung komunitas dan mulai mengorganisir meetup di wilayahmu.')}
            </p>
            <Link href="/register">
              <Button className="mt-5 gap-2">
                {t('Join now', 'Gabung sekarang')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </section>
        )}
      </div>

      <Dialog open={Boolean(filters.paidRsvp)} onOpenChange={(open) => !open && clearEventsPayment()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('Complete your payment', 'Selesaikan pembayaran')}</DialogTitle>
            <DialogDescription>
              {t('Your seat is held once the payment is confirmed.', 'Kursimu diamankan setelah pembayaran dikonfirmasi.')}
            </DialogDescription>
          </DialogHeader>
          {filters.paidRsvp && (
            <PaymentCard
              table="event_rsvps"
              recordId={filters.paidRsvp.rsvpId}
              itemName={t('Event registration', 'Pendaftaran event')}
              amount={filters.paidRsvp.amount}
              paymentStatus={filters.paidRsvp.paymentStatus}
              paymentLinkUrl={null}
              paymentNote={null}
              fallbackUrl={fetchEventsSettings.data ?? null}
              onStatusChange={(status) =>
                setFilters((prev) => ({
                  ...prev,
                  paidRsvp: prev.paidRsvp ? { ...prev.paidRsvp, paymentStatus: status } : null,
                }))
              }
            />
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
