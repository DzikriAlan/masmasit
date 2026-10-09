'use client';

import Link from 'next/link';

import { useLang } from '@/components/language-provider';
import { Badge } from '@/components/ui/badge';

import { ACTIVITY_STATUS_VARIANT, type DataActivityEvent } from '@/features/activity/types/activityTypes';
import { ActivityPanel, ActivityRow } from '@/features/activity/components/ActivityPanel';

interface Props {
  rsvps: DataActivityEvent[];
  isLoading: boolean;
  isError: boolean;
}

/** Event RSVPs (TC-08-06). */
export function ActivityEvents({ rsvps, isLoading, isError }: Props) {
  const { t } = useLang();

  return (
    <ActivityPanel
      title={t('Event RSVPs', 'RSVP Event')}
      description={t('Events you registered for.', 'Event yang Anda daftari.')}
      isLoading={isLoading}
      isError={isError}
      isEmpty={rsvps.length === 0}
      emptyTitle={t('You have not RSVPed to any event.', 'Anda belum RSVP event apa pun.')}
    >
      {rsvps.map((r) => {
        const isUnpaid = Boolean(r.events?.is_paid) && r.payment_status !== 'paid';
        return (
          <ActivityRow key={r.id}>
            <div className="min-w-0">
              <Link href={r.events?.id ? `/events/${r.events.id}` : '/events'} className="font-medium hover:underline">
                {r.events?.title ?? t('Event removed', 'Event dihapus')}
              </Link>
              <p className="text-xs text-muted-foreground">
                {r.events ? new Date(r.events.event_date).toLocaleString('id-ID') : '—'}
                {r.events?.location ? ` · ${r.events.location}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isUnpaid && <Badge variant="outline" className="text-xs">{t('Unpaid', 'Belum bayar')}</Badge>}
              <Badge variant={ACTIVITY_STATUS_VARIANT[r.status] ?? 'outline'} className="capitalize">{r.status.replace('_', ' ')}</Badge>
            </div>
          </ActivityRow>
        );
      })}
    </ActivityPanel>
  );
}
