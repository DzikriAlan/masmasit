'use client';

import { useLang } from '@/components/language-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ReviewForm, StarRating } from '@/components/review-form';

import type { DataTalentsBooking } from '@/features/talents/types/talentsTypes';
import { ACTIVITY_STATUS_VARIANT } from '@/features/activity/types/activityTypes';
import { ActivityPanel } from '@/features/activity/components/ActivityPanel';

type BookingWithTalent = DataTalentsBooking & { talent_id?: string };

interface Props {
  incomingBookings: DataTalentsBooking[];
  myBookings: BookingWithTalent[];
  isLoading: boolean;
  /** booking_id → rating the member already gave. */
  myRatings: Record<string, number>;
  reviewing: boolean;
  onEditBookingStatus: (bookingId: string, status: string) => void;
  onSubmitBookingReview: (booking: { bookingId: string; talentId: string }, review: { rating: number; comment: string }) => void;
}

/** Bookings received (talent side) and made (client side, with rating — TC-06-06). */
export function ActivityBookings({
  incomingBookings,
  myBookings,
  isLoading,
  myRatings,
  reviewing,
  onEditBookingStatus,
  onSubmitBookingReview,
}: Props) {
  const { t } = useLang();

  return (
    <div className="space-y-6">
      <ActivityPanel
        title={t('Booking Requests', 'Permintaan Booking')}
        description={t('Sessions clients booked with you. Accept or decline them here.', 'Sesi yang dipesan klien kepada Anda. Terima atau tolak di sini.')}
        isLoading={isLoading}
        isEmpty={incomingBookings.length === 0}
        emptyTitle={t('No incoming bookings.', 'Belum ada booking masuk.')}
      >
        {incomingBookings.map((b) => (
          <div key={b.id} className="rounded-lg border border-border/60 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium capitalize">{b.booking_type}</p>
                <p className="text-xs text-muted-foreground">
                  {b.profiles?.full_name ?? b.client_name ?? t('External client', 'Klien eksternal')} ·{' '}
                  {new Date(b.scheduled_at).toLocaleString('id-ID')}
                </p>
              </div>
              <Badge variant={ACTIVITY_STATUS_VARIANT[b.status] ?? 'outline'} className="capitalize">{b.status}</Badge>
            </div>
            {b.notes && <p className="mt-2 rounded-md bg-muted/40 p-3 text-sm">{b.notes}</p>}
            {b.status === 'pending' && (
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={() => onEditBookingStatus(b.id, 'confirmed')}>{t('Accept', 'Terima')}</Button>
                <Button size="sm" variant="outline" onClick={() => onEditBookingStatus(b.id, 'cancelled')}>{t('Decline', 'Tolak')}</Button>
              </div>
            )}
            {b.status === 'confirmed' && (
              <Button size="sm" variant="outline" className="mt-3" onClick={() => onEditBookingStatus(b.id, 'completed')}>
                {t('Mark completed', 'Tandai selesai')}
              </Button>
            )}
          </div>
        ))}
      </ActivityPanel>

      <ActivityPanel
        title={t('Sessions You Booked', 'Sesi yang Anda Pesan')}
        isLoading={isLoading}
        isEmpty={myBookings.length === 0}
        emptyTitle={t('You have not booked any session.', 'Anda belum memesan sesi.')}
      >
        {myBookings.map((b) => {
          const givenRating = myRatings[b.id] ?? 0;
          const canReview = b.status === 'completed' && !givenRating && Boolean(b.talent_id);
          return (
            <div key={b.id} className="space-y-3 rounded-lg border border-border/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{b.profiles?.full_name ?? t('Talent', 'Talent')}</p>
                  <p className="text-xs text-muted-foreground">
                    <span className="capitalize">{b.booking_type}</span> · {new Date(b.scheduled_at).toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {givenRating > 0 && <StarRating value={givenRating} size="sm" />}
                  <Badge variant={ACTIVITY_STATUS_VARIANT[b.status] ?? 'outline'} className="capitalize">{b.status}</Badge>
                </div>
              </div>
              {canReview && (
                <ReviewForm
                  title={t('Rate this session', 'Beri rating sesi ini')}
                  submitting={reviewing}
                  onSubmitReview={(review) => onSubmitBookingReview({ bookingId: b.id, talentId: b.talent_id as string }, review)}
                />
              )}
            </div>
          );
        })}
      </ActivityPanel>
    </div>
  );
}
