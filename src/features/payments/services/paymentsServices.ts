import { supabase } from '@/shared/lib/supabase';
import { toApiResponse } from '@/shared/lib/apiResponse';

import type { PayloadPatchPaymentsConfirmation } from '../types/paymentsTypes';

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
