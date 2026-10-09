'use client';

import { useLang } from '@/components/language-provider';
import { Badge } from '@/components/ui/badge';

import {
  ACTIVITY_STATUS_VARIANT,
  type DataActivityRequests,
  type PayloadPostActivityRequestPayment,
} from '@/features/activity/types/activityTypes';
import { ActivityPanel } from '@/features/activity/components/ActivityPanel';
import { ActivityRequestPayment } from '@/features/activity/components/ActivityRequestPayment';

interface Props {
  requests: DataActivityRequests;
  isLoading: boolean;
  isError: boolean;
  submitting: boolean;
  onSubmitPayment: (payload: PayloadPostActivityRequestPayment) => void;
}

/** Service requests with status and DP / final payment (TC-05-10). */
export function ActivityRequests({ requests, isLoading, isError, submitting, onSubmitPayment }: Props) {
  const { t } = useLang();

  return (
    <ActivityPanel
      title={t('Service Requests', 'Permintaan Layanan')}
      description={t('Requests you sent from Services, with their status and payments.', 'Permintaan yang Anda kirim dari Services, beserta status dan pembayarannya.')}
      isLoading={isLoading}
      isError={isError}
      isEmpty={requests.requests.length === 0}
      emptyTitle={t('You have not sent a service request.', 'Anda belum mengirim permintaan layanan.')}
    >
      {requests.requests.map((r) => {
        const serviceName = r.agency_services?.title ?? t('Service request', 'Permintaan layanan');
        const hasDp = r.dp_amount != null && r.dp_amount > 0;
        const finalAmount = Math.max((r.budget ?? 0) - (r.dp_amount ?? 0), 0);
        const showFinal = finalAmount > 0 && (r.dp_payment_status === 'paid' || !hasDp) && ['in_progress', 'completed'].includes(r.status);
        return (
          <div key={r.id} className="space-y-3 rounded-lg border border-border/60 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium">{serviceName}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString('id-ID')}
                  {r.budget ? ` · Rp ${r.budget.toLocaleString('id-ID')}` : ''}
                </p>
              </div>
              <Badge variant={ACTIVITY_STATUS_VARIANT[r.status] ?? 'outline'} className="capitalize">{r.status.replace('_', ' ')}</Badge>
            </div>
            <p className="line-clamp-3 rounded-md bg-muted/40 p-3 text-sm">{r.scope}</p>
            {hasDp && (
              <ActivityRequestPayment
                title={t('Down payment (DP)', 'Uang muka (DP)')}
                itemName={serviceName}
                amount={r.dp_amount ?? 0}
                paymentStatus={r.dp_payment_status}
                payUrl={r.dp_payment_link_url || requests.fallbackUrl}
                paymentNote={r.dp_payment_note}
                submitting={submitting}
                onSubmitConfirmation={(note) => onSubmitPayment({ projectId: r.id, stage: 'dp', note })}
              />
            )}
            {showFinal && (
              <ActivityRequestPayment
                title={t('Final payment', 'Pelunasan')}
                itemName={serviceName}
                amount={finalAmount}
                paymentStatus={r.final_payment_status}
                payUrl={r.final_payment_link_url || requests.fallbackUrl}
                paymentNote={r.final_payment_note}
                submitting={submitting}
                onSubmitConfirmation={(note) => onSubmitPayment({ projectId: r.id, stage: 'final', note })}
              />
            )}
          </div>
        );
      })}
    </ActivityPanel>
  );
}
