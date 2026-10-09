'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Ban, CalendarDays, CheckCircle2, Loader2, MapPin, Pencil, Users } from 'lucide-react';
import { toast } from 'sonner';

import type { DataEventsDetail } from '@/features/events/types/eventsTypes';
import { useEventsDetailControllers } from '@/features/events/controllers/eventsControllers';
import { EventsCreateForm, type EventsFormValues } from '@/features/events/components/EventsCreateForm';
import { EventsAttendees } from '@/features/events/components/EventsAttendees';
import { PaymentCard } from '@/features/payments/components/PaymentCard';
import { useFeeActive } from '@/features/payments/controllers/paymentsControllers';

import { AppShell } from '@/components/app-shell';
import { LoadData } from '@/components/load-data';
import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { API_ERROR_CODE } from '@/shared/lib/apiResponse';
import { TONE_CHIP, toneOf } from '@/shared/lib/tones';
import { cn, loginHref } from '@/shared/lib/utils';

interface Props {
  eventId: string;
}

export default function EventsDetail({ eventId }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLang();
  const {
    fetchEventsDetail,
    fetchEventsMyRsvp,
    fetchEventsAttendees,
    fetchEventsRegions,
    fetchEventsSettings,
    storeEventsRsvp,
    modifyEvents,
    modifyEventsStatus,
    isOrganiser,
  } = useEventsDetailControllers(eventId, user?.id);
  // With the event fee switched off, a paid event is a free RSVP.
  const { active: eventFeeActive } = useFeeActive('event');

  const [filters, setFilters] = useState({
    isEditing: false,
    isCancelOpen: false,
    form: null as EventsFormValues | null,
  });

  const data = useMemo(() => {
    const event = fetchEventsDetail.data ?? null;

    const getLocalInput = (iso: string) => {
      const date = new Date(iso);
      const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
      return local.toISOString().slice(0, 16);
    };

    const getFormValues = (item: DataEventsDetail): EventsFormValues => ({
      title: item.title,
      description: item.description,
      event_type: item.event_type,
      location: item.location,
      event_date: getLocalInput(item.event_date),
      max_capacity: String(item.max_capacity),
      is_paid: item.is_paid,
      price: String(item.price ?? 0),
      region_id: item.region_id,
    });

    const paymentLabels: Record<string, string> = {
      paid: t('Paid', 'Lunas'),
      awaiting_confirmation: t('Awaiting confirmation', 'Menunggu konfirmasi'),
      unpaid: t('Unpaid', 'Belum bayar'),
    };

    const getDateTime = (iso: string) =>
      new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

    const attendees = (fetchEventsAttendees.data ?? []).map((a) => ({
      id: a.rsvp_id,
      name: a.full_name ?? t('Anonymous', 'Anonim'),
      email: a.email ?? '',
      rsvpStatus: a.rsvp_status,
      paymentStatus: a.payment_status,
      paymentLabel: paymentLabels[a.payment_status] ?? a.payment_status,
      registeredAt: getDateTime(a.registered_at),
    }));

    const myRsvp = fetchEventsMyRsvp.data ?? null;
    const attending = event?.event_rsvps?.length ?? 0;
    const isCancelled = event?.status === 'cancelled';
    const isPast = event ? new Date(event.event_date).getTime() <= Date.now() : false;
    const spotsLeft = event ? Math.max(event.max_capacity - attending, 0) : 0;

    return {
      event,
      formValues: event ? getFormValues(event) : null,
      attendees,
      myRsvp,
      attending,
      isCancelled,
      isPast,
      spotsLeft,
      isRegistered: Boolean(myRsvp),
      canRsvp: Boolean(event) && !isCancelled && !isPast && event?.approval_status === 'approved' && spotsLeft > 0,
      isPaidEvent: Boolean(event?.is_paid && eventFeeActive),
      needsPayment: Boolean(eventFeeActive && event?.is_paid && event.price && myRsvp && myRsvp.payment_status !== 'paid'),
      schedule: event ? getDateTime(event.event_date) : '',
      priceLabel: eventFeeActive && event?.is_paid && event.price ? `Rp ${(event.price / 1000).toFixed(0)}K` : null,
      isLoading: fetchEventsDetail.isPending,
      isError: fetchEventsDetail.isError,
      isEmpty: !fetchEventsDetail.isPending && !fetchEventsDetail.isError && !event,
      emptyTitle: t('Event not found.', 'Event tidak ditemukan.'),
      emptySubtitle: t('It may have been removed or is still awaiting review.', 'Mungkin sudah dihapus atau masih menunggu peninjauan.'),
      errorTitle: t('Could not load this event.', 'Gagal memuat event ini.'),
    };
  }, [fetchEventsDetail.data, fetchEventsDetail.isPending, fetchEventsDetail.isError, fetchEventsAttendees.data, fetchEventsMyRsvp.data, eventFeeActive, t]);

  const submitEventsRsvp = async () => {
    if (!user) {
      router.push(loginHref());
      return;
    }
    try {
      await storeEventsRsvp.mutateAsync({ event_id: eventId });
    } catch (error) {
      const code = error instanceof Error ? error.name : '';
      const message = error instanceof Error ? error.message : '';
      if (code === API_ERROR_CODE.CONFLICT) toast.error(t('Already registered', 'Sudah terdaftar'));
      else if (message.includes('cancelled')) toast.error(t('This event has been cancelled', 'Event ini dibatalkan'));
      else if (message.includes('full')) toast.error(t('This event is full', 'Event ini sudah penuh'));
      else toast.error(t('Failed to RSVP', 'Gagal RSVP'));
      return;
    }
    toast.success(t('RSVP confirmed — see you there.', 'RSVP dikonfirmasi — sampai jumpa.'));
  };

  const editEventsComposer = () => {
    setFilters((prev) => ({ ...prev, isEditing: !prev.isEditing, form: data.formValues }));
  };

  const editEventsForm = (patch: Partial<EventsFormValues>) => {
    setFilters((prev) => ({ ...prev, form: prev.form ? { ...prev.form, ...patch } : prev.form }));
  };

  const clearEventsForm = () => {
    setFilters((prev) => ({ ...prev, isEditing: false, form: null }));
  };

  const submitEventsEdit = async () => {
    const form = filters.form;
    if (!form) return;
    try {
      await modifyEvents.mutateAsync({
        title: form.title.trim(),
        description: form.description.trim(),
        event_type: form.event_type,
        location: form.location.trim(),
        event_date: new Date(form.event_date).toISOString(),
        max_capacity: Number.parseInt(form.max_capacity, 10) || 50,
        is_paid: form.is_paid,
        price: form.is_paid ? Number.parseInt(form.price, 10) || 0 : null,
        region_id: form.region_id,
      });
    } catch {
      toast.error(t('Failed to update event', 'Gagal memperbarui event'));
      return;
    }
    toast.success(t('Event updated', 'Event diperbarui'));
    clearEventsForm();
  };

  const editEventsCancelDialog = (isCancelOpen: boolean) => {
    setFilters((prev) => ({ ...prev, isCancelOpen }));
  };

  const clearEvents = async () => {
    try {
      await modifyEventsStatus.mutateAsync('cancelled');
    } catch {
      toast.error(t('Failed to cancel event', 'Gagal membatalkan event'));
      editEventsCancelDialog(false);
      return;
    }
    toast.success(t('Event cancelled — attendees have been notified.', 'Event dibatalkan — peserta sudah diberi tahu.'));
    editEventsCancelDialog(false);
  };

  const loadAttendeesCsv = () => {
    const getCell = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const header = ['Name', 'Email', 'RSVP status', 'Payment status', 'Registered at'];
    const rows = data.attendees.map((a) => [a.name, a.email, a.rsvpStatus, a.paymentStatus, a.registeredAt]);
    const csv = [header, ...rows].map((row) => row.map(getCell).join(',')).join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const slug = (data.event?.title ?? 'event').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    link.href = url;
    link.download = `${slug || 'event'}-attendees.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const event = data.event;

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/events">
          <Button variant="ghost" className="mb-4 gap-2"><ArrowLeft className="h-4 w-4" /> {t('All events', 'Semua event')}</Button>
        </Link>

        <LoadData minHeight="40vh" response={data}>
          {event && (
            <>
              <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
                <div className="flex flex-wrap items-center gap-2">
                  {data.isCancelled && (
                    <Badge variant="destructive" className="text-[11px]">{t('Cancelled', 'Dibatalkan')}</Badge>
                  )}
                  {event.approval_status !== 'approved' && (
                    <Badge variant="secondary" className="text-[11px] capitalize">
                      {event.approval_status === 'pending' ? t('Awaiting review', 'Menunggu peninjauan') : event.approval_status}
                    </Badge>
                  )}
                  <Badge variant="outline" className={cn('text-[11px] capitalize', TONE_CHIP[toneOf('events')])}>{event.event_type}</Badge>
                  {event.regions?.name && <Badge variant="outline" className="text-[11px]">{event.regions.name}</Badge>}
                  {data.priceLabel && <Badge variant="secondary" className="text-[11px]">{data.priceLabel}</Badge>}
                  {data.isPast && !data.isCancelled && <Badge variant="outline" className="text-[11px]">{t('Ended', 'Selesai')}</Badge>}
                </div>

                <h1 className={cn('mt-3 font-display text-2xl font-semibold text-balance sm:text-3xl', data.isCancelled && 'line-through decoration-1')}>
                  {event.title}
                </h1>

                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{data.schedule}</span>
                  <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{event.location}</span>
                  <span className="flex items-center gap-1.5"><Users className="h-4 w-4" />{data.attending}/{event.max_capacity}</span>
                </div>

                <p className="mt-5 whitespace-pre-wrap leading-relaxed text-pretty">{event.description}</p>

                <div className="mt-6 border-t border-border pt-5">
                  {data.isCancelled ? (
                    <p className="flex items-center gap-1.5 text-sm font-medium text-destructive">
                      <Ban className="h-4 w-4" />
                      {t('This event has been cancelled. RSVPs are closed.', 'Event ini dibatalkan. RSVP ditutup.')}
                    </p>
                  ) : data.isRegistered ? (
                    <p className="flex items-center gap-1.5 text-sm font-medium text-success">
                      <CheckCircle2 className="h-4 w-4" /> {t('Registered', 'Terdaftar')}
                    </p>
                  ) : isOrganiser ? null : (
                    <Button className="gap-2" disabled={storeEventsRsvp.isPending || (Boolean(user) && !data.canRsvp)} onClick={submitEventsRsvp}>
                      {storeEventsRsvp.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                      {data.spotsLeft > 0 || !user ? t('RSVP now', 'RSVP sekarang') : t('Sold out', 'Penuh')}
                    </Button>
                  )}

                  {!data.isCancelled && data.needsPayment && data.myRsvp && event.price && (
                    <div className="mt-4 max-w-md">
                      <PaymentCard
                        table="event_rsvps"
                        recordId={data.myRsvp.id}
                        itemName={t('Event registration', 'Pendaftaran event')}
                        amount={event.price}
                        paymentStatus={data.myRsvp.payment_status}
                        paymentLinkUrl={null}
                        paymentNote={data.myRsvp.payment_note}
                        fallbackUrl={fetchEventsSettings.data ?? null}
                        onStatusChange={() => fetchEventsMyRsvp.refetch()}
                      />
                    </div>
                  )}
                </div>

                {isOrganiser && !data.isCancelled && (
                  <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-5">
                    <Button size="sm" variant="outline" className="gap-2" onClick={editEventsComposer}>
                      <Pencil className="h-3.5 w-3.5" /> {filters.isEditing ? t('Close editor', 'Tutup editor') : t('Edit event', 'Ubah event')}
                    </Button>
                    <Button size="sm" variant="outline" className="gap-2 text-destructive hover:text-destructive" onClick={() => editEventsCancelDialog(true)}>
                      <Ban className="h-3.5 w-3.5" /> {t('Cancel event', 'Batalkan event')}
                    </Button>
                  </div>
                )}
              </section>

              {isOrganiser && filters.isEditing && filters.form && (
                <div className="mt-6">
                  <EventsCreateForm
                    mode="edit"
                    values={filters.form}
                    regions={fetchEventsRegions.data ?? []}
                    saving={modifyEvents.isPending}
                    onEditEvents={editEventsForm}
                    onSubmitEvents={submitEventsEdit}
                    onClearEvents={clearEventsForm}
                  />
                </div>
              )}

              {isOrganiser && (
                <EventsAttendees
                  attendees={data.attendees}
                  isLoading={fetchEventsAttendees.isPending}
                  isError={fetchEventsAttendees.isError}
                  isPaidEvent={data.isPaidEvent}
                  onLoadAttendeesCsv={loadAttendeesCsv}
                />
              )}
            </>
          )}
        </LoadData>
      </div>

      <AlertDialog open={filters.isCancelOpen} onOpenChange={editEventsCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('Cancel this event?', 'Batalkan event ini?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'Everyone who RSVP\'d gets a cancellation notice, and new RSVPs are closed.',
                'Semua yang sudah RSVP menerima pemberitahuan pembatalan, dan RSVP baru ditutup.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('Keep event', 'Tetap adakan')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); clearEvents(); }}
              disabled={modifyEventsStatus.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {modifyEventsStatus.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('Cancel event', 'Batalkan event')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
