'use client';

import { useState } from 'react';
import { ExternalLink, CreditCard, CheckCircle2, Clock, Loader2, Send } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useLang } from '@/components/language-provider';
import { toast } from 'sonner';

import { usePaymentsControllers } from '@/features/payments/controllers/paymentsControllers';

interface PaymentCardProps {
  table: 'bookings' | 'enrollments' | 'event_rsvps';
  recordId: string;
  itemName: string;
  amount: number;
  paymentStatus: string;
  paymentLinkUrl: string | null;
  paymentNote: string | null;
  fallbackUrl: string | null;
  onStatusChange?: (newStatus: string) => void;
}

export function PaymentCard({
  table,
  recordId,
  itemName,
  amount,
  paymentStatus,
  paymentLinkUrl,
  paymentNote,
  fallbackUrl,
  onStatusChange,
}: PaymentCardProps) {
  const { t } = useLang();
  const [note, setNote] = useState(paymentNote ?? '');
  const { changePaymentsConfirmation } = usePaymentsControllers();

  const submitting = changePaymentsConfirmation.isPending;

  const payUrl = paymentLinkUrl || fallbackUrl;
  const formattedAmount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

  const statusConfig: Record<string, { label: string; variant: 'secondary' | 'default' | 'outline'; icon: typeof Clock; color: string }> = {
    unpaid: { label: t('Unpaid', 'Belum Bayar'), variant: 'outline', icon: Clock, color: 'text-muted-foreground' },
    awaiting_confirmation: { label: t('Awaiting confirmation', 'Menunggu Konfirmasi'), variant: 'secondary', icon: Clock, color: 'text-amber-400' },
    paid: { label: t('Paid', 'Lunas'), variant: 'default', icon: CheckCircle2, color: 'text-success' },
  };

  const config = statusConfig[paymentStatus] ?? statusConfig.unpaid;
  const StatusIcon = config.icon;

  const saveNote = async () => {
    try {
      await changePaymentsConfirmation.mutateAsync({ table, recordId, note: note || null });
    } catch {
      toast.error(t('Failed to submit confirmation', 'Gagal mengirim konfirmasi'));
      return;
    }
    toast.success(t('Payment confirmation submitted! Admin will verify shortly.', 'Konfirmasi pembayaran dikirim! Admin akan segera memverifikasi.'));
    onStatusChange?.('awaiting_confirmation');
  };

  return (
    <Card className="glass border-primary/20">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            {t('Complete Your Payment', 'Selesaikan Pembayaran')}
          </h3>
          <Badge variant={config.variant} className={`gap-1 ${config.color}`}>
            <StatusIcon className="h-3.5 w-3.5" />
            {config.label}
          </Badge>
        </div>

        <div className="rounded-lg border border-border/60 p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{itemName}</span>
            <span className="font-bold text-base">{formattedAmount}</span>
          </div>
        </div>

        {paymentStatus !== 'paid' && (
          <>
            {payUrl && (
              <a href={payUrl} target="_blank" rel="noreferrer">
                <Button className="w-full gap-2 glow-primary">
                  <ExternalLink className="h-4 w-4" />
                  {t('Pay via Lynk.id', 'Bayar via Lynk.id')}
                </Button>
              </a>
            )}

            <div className="space-y-2">
              <Label htmlFor="pnote" className="text-sm">
                {t('Already paid? Let us know', 'Sudah bayar? Beri tahu kami')}
              </Label>
              <Textarea
                id="pnote"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t('Paste your payment reference or note (optional)', 'Tempel referensi pembayaran atau catatan Anda (opsional)')}
                className="min-h-[60px] resize-none"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={saveNote}
                disabled={submitting || paymentStatus === 'awaiting_confirmation'}
                className="w-full gap-2"
              >
                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                {paymentStatus === 'awaiting_confirmation'
                  ? t('Confirmation submitted', 'Konfirmasi dikirim')
                  : t('Submit Confirmation', 'Kirim Konfirmasi')}
              </Button>
            </div>
          </>
        )}

        {paymentStatus === 'paid' && (
          <div className="flex items-center gap-2 rounded-lg bg-success/10 p-3 text-success">
            <CheckCircle2 className="h-5 w-5" />
            <p className="text-sm font-medium">{t('Payment confirmed. You\'re all set!', 'Pembayaran dikonfirmasi. Anda siap!')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
