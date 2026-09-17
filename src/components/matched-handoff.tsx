'use client';

import { MessageCircle, Clock } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLang } from '@/components/language-provider';
import { waLink } from '@/shared/lib/external';
import { cn } from '@/shared/lib/utils';

/**
 * A project↔team match is not a booking. Talents and Services are self-serve
 * and confirm instantly; a match here is handed to a person who creates the
 * WhatsApp group manually, which takes up to 1×24 hours. Both sides need to
 * see that difference at a glance, so Matched gets its own badge and its own
 * panel rather than reusing the confirmed/paid treatment.
 */

/** The distinct status pill. Deliberately not the success/confirmed colour. */
export function MatchedBadge({ className }: { className?: string }) {
  const { t } = useLang();
  return (
    <Badge
      variant="outline"
      className={cn('gap-1 border-warning/50 bg-warning/10 text-xs font-semibold text-warning', className)}
    >
      <MessageCircle className="h-3 w-3" />
      {t('Matched — continue on WhatsApp', 'Matched — lanjut ke WhatsApp')}
    </Badge>
  );
}

interface MatchedHandoffProps {
  /** Named in the prefilled message so the chat opens on the right subject. */
  subject: string;
  className?: string;
}

export function MatchedHandoff({ subject, className }: MatchedHandoffProps) {
  const { t } = useLang();

  const href = waLink(
    `Halo MasmasIT, kami sudah Matched untuk "${subject}". Mohon dibuatkan grup WhatsApp-nya.`
  );

  return (
    <div className={cn('rounded-lg border border-warning/40 bg-warning/5 p-4', className)}>
      <MatchedBadge />
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty">
        {t(
          'Both sides now continue on WhatsApp. This step is done by a person, not automatically — the group is created manually, so allow up to 1×24 hours.',
          'Kedua pihak kini lanjut di WhatsApp. Langkah ini dikerjakan orang, bukan otomatis — grupnya dibuat manual, jadi perlu waktu hingga 1×24 jam.'
        )}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <a href={href} target="_blank" rel="noreferrer">
          <Button size="sm" className="gap-2">
            <MessageCircle className="h-4 w-4" />
            {t('Open WhatsApp', 'Buka WhatsApp')}
          </Button>
        </a>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          {t('Group created within 1×24 hours', 'Grup dibuat dalam 1×24 jam')}
        </span>
      </div>
    </div>
  );
}
