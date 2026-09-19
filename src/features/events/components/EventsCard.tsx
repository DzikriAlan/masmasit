'use client';

import { CalendarDays, CheckCircle2, Loader2, MapPin, Users } from 'lucide-react';

import { useLang } from '@/components/language-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TONE_CHIP, toneOf } from '@/shared/lib/tones';
import { cn } from '@/shared/lib/utils';

export interface EventsCardItem {
  id: string;
  title: string;
  description: string;
  type: string;
  regionName: string | null;
  location: string;
  schedule: string;
  isPaid: boolean;
  priceLabel: string | null;
  attending: number;
  capacity: number;
  spotsLeft: number;
  fillPercent: number;
  isRegistered: boolean;
}

/**
 * An event card leads with when and where — the two things that decide
 * whether someone can go at all — and shows remaining capacity as a bar
 * because "3 spots left" is what actually converts an RSVP.
 */
export function EventsCard({
  event,
  isSubmitting,
  onSubmitRsvp,
}: Readonly<{ event: EventsCardItem; isSubmitting: boolean; onSubmitRsvp: (eventId: string) => void }>) {
  const { t } = useLang();

  return (
    <article className="flex h-full min-w-0 flex-col rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className={cn('text-[11px] capitalize', TONE_CHIP[toneOf('events')])}>
          {event.type}
        </Badge>
        {event.regionName && <Badge variant="outline" className="text-[11px]">{event.regionName}</Badge>}
        {event.isPaid && event.priceLabel && (
          <Badge variant="secondary" className="text-[11px]">{event.priceLabel}</Badge>
        )}
      </div>

      <h3 className="mt-3 line-clamp-2 font-semibold leading-snug">{event.title}</h3>
      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground text-pretty">{event.description}</p>

      <dl className="mt-4 space-y-1.5 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <dt className="sr-only">{t('Date', 'Tanggal')}</dt>
          <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <dd className="truncate">{event.schedule}</dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="sr-only">{t('Location', 'Lokasi')}</dt>
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <dd className="truncate">{event.location}</dd>
        </div>
      </dl>

      <div className="mt-auto space-y-3 pt-4">
        <div>
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="h-3 w-3" aria-hidden />
              {event.attending}/{event.capacity}
            </span>
            <span className={cn('font-medium', event.fillPercent > 80 ? 'text-warning' : 'text-muted-foreground')}>
              {event.spotsLeft > 0
                ? `${event.spotsLeft} ${t('spots left', 'slot tersisa')}`
                : t('Full', 'Penuh')}
            </span>
          </div>
          <Progress value={event.fillPercent} className="mt-1.5 h-1.5" />
        </div>

        {event.isRegistered ? (
          <p className="flex items-center gap-1.5 text-sm font-medium text-success">
            <CheckCircle2 className="h-4 w-4" />
            {t('Registered', 'Terdaftar')}
          </p>
        ) : (
          <Button
            size="sm"
            className="w-full gap-2"
            disabled={isSubmitting || event.spotsLeft <= 0}
            onClick={() => onSubmitRsvp(event.id)}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {event.spotsLeft > 0 ? t('RSVP', 'RSVP') : t('Sold out', 'Penuh')}
          </Button>
        )}
      </div>
    </article>
  );
}
