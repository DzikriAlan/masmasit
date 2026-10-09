import { supabase } from '@/shared/lib/supabase';
import { toApiResponse } from '@/shared/lib/apiResponse';

import type { DataPaymentsFeeSettings, PayloadPatchPaymentsConfirmation } from '../types/paymentsTypes';

/**
 * Member-side payment confirmation. The row moves to
 * `awaiting_confirmation`; only an admin can set it to `paid`.
 */
export const updatePaymentsConfirmation = async (payload: PayloadPatchPaymentsConfirmation) => {
  return toApiResponse<null>(
    supabase
      .from(payload.table)
      .update({ payment_note: payload.note, payment_status: 'awaiting_confirmation' })
      .eq('id', payload.recordId),
    'Payment confirmation submitted successfully'
  );
};

/** Module fee switches from the app_settings singleton (TC-13-03). */
export const getPaymentsFeeSettings = async () => {
  return toApiResponse<DataPaymentsFeeSettings | null>(
    supabase
      .from('app_settings')
      .select('job_fee_active, project_fee_active, lms_fee_active, event_fee_active')
      .limit(1)
      .maybeSingle(),
    'Fee settings retrieved successfully'
  );
};
