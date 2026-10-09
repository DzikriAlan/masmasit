'use client';

import { useState } from 'react';
import { CheckCircle2, Clock, CreditCard, ExternalLink, Loader2, Send } from 'lucide-react';

import { useLang } from '@/components/language-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PAYMENT_PROVIDER } from '@/shared/lib/external';

interface Props {
  title: string;
  itemName: string;
  amount: number;
  paymentStatus: string;
  payUrl: string | null;
  paymentNote: string | null;
  submitting: boolean;
  onSubmitConfirmation: (note: string | null) => void;
}

/**
 * DP / final payment for a service request. Same flow and wording as
 * features/payments PaymentCard, which only writes to bookings / enrollments
 * / event_rsvps; agency_projects' dp_* / final_* columns are reported through
 * the report_agency_project_payment RPC (031) instead.
 */
export function ActivityRequestPayment({
  title,
  itemName,
  amount,
  paymentStatus,
  payUrl,
  paymentNote,
  submitting,
  onSubmitConfirmation,
}: Props) {
  const { t } = useLang();
  const [note, setNote] = useState(paymentNote ?? '');

  const statusConfig: Record<string, { label: string; variant: 'secondary' | 'default' | 'outline'; color: string; icon: typeof Clock }> = {
    unpaid: { label: t('Unpaid', 'Belum Bayar'), variant: 'outline', color: 'text-muted-foreground', icon: Clock },
    awaiting_confirmation: { label: t('Awaiting confirmation', 'Menunggu Konfirmasi'), variant: 'secondary', color: 'text-amber-400', icon: Clock },
    paid: { label: t('Paid', 'Lunas'), variant: 'default', color: 'text-success', icon: CheckCircle2 },
  };
  const config = statusConfig[paymentStatus] ?? statusConfig.unpaid;
  const StatusIcon = config.icon;
  const formattedAmount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  const isAwaiting = paymentStatus === 'awaiting_confirmation';

  return (
    <div className="space-y-3 rounded-lg border border-primary/20 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-semibold"><CreditCard className="h-4 w-4 text-primary" /> {title}</p>
        <Badge variant={config.variant} className={`gap-1 ${config.color}`}><StatusIcon className="h-3.5 w-3.5" /> {config.label}</Badge>
      </div>
      <div className="flex items-center justify-between rounded-md border border-border/60 p-3 text-sm">
        <span className="text-muted-foreground">{itemName}</span>
        <span className="font-bold">{formattedAmount}</span>
      </div>

      {paymentStatus !== 'paid' && (
        <>
          {payUrl && (
            <div className="space-y-2">
              <p className="rounded-md border border-border/60 bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
                {t(
                  `You will be taken to ${PAYMENT_PROVIDER} to complete this payment. ${PAYMENT_PROVIDER} is an external platform — MasmasIT never sees your card details.`,
                  `Kamu akan diarahkan ke ${PAYMENT_PROVIDER} untuk menyelesaikan pembayaran ini. ${PAYMENT_PROVIDER} adalah platform eksternal — MasmasIT tidak pernah melihat detail kartumu.`
                )}
              </p>
              <a href={payUrl} target="_blank" rel="noreferrer">
                <Button size="sm" className="w-full gap-2"><ExternalLink className="h-4 w-4" /> {t(`Continue to ${PAYMENT_PROVIDER}`, `Lanjut ke ${PAYMENT_PROVIDER}`)}</Button>
              </a>
            </div>
          )}
          <div className="space-y-2">
            <Label className="text-sm">{t('Already paid? Let us know', 'Sudah bayar? Beri tahu kami')}</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('Paste your payment reference or note (optional)', 'Tempel referensi pembayaran atau catatan Anda (opsional)')}
              className="min-h-[60px] resize-none"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSubmitConfirmation(note.trim() || null)}
              disabled={submitting || isAwaiting}
              className="w-full gap-2"
            >
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              {isAwaiting ? t('Confirmation submitted', 'Konfirmasi dikirim') : t('Submit Confirmation', 'Kirim Konfirmasi')}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
