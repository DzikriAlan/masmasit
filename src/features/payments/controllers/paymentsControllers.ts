import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { unwrapApiResponse } from '@/shared/lib/apiResponse';

import { getPaymentsFeeSettings, updatePaymentsConfirmation } from '../services/paymentsServices';
import type { PayloadPatchPaymentsConfirmation, PaymentsFeeModule } from '../types/paymentsTypes';

export const usePaymentsControllers = () => {
  const queryClient = useQueryClient();

  const changePaymentsConfirmation = useMutation({
    mutationFn: async (payload: PayloadPatchPaymentsConfirmation) =>
      unwrapApiResponse(await updatePaymentsConfirmation(payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPayments'] });
    },
  });

  return { changePaymentsConfirmation };
};

/**
 * Whether a module currently charges (Admin → Fee Management, TC-13-03).
 * `active` is true while loading or when the setting cannot be read, so a
 * paid flow is never skipped by accident; it only turns false once the
 * admin has explicitly switched the module's fee off. `module` undefined
 * (e.g. talent bookings, which have no switch) is always active.
 */
export const useFeeActive = (module: PaymentsFeeModule | undefined) => {
  const fetchPaymentsFeeSettings = useQuery({
    queryKey: ['paymentsFeeSettings'],
    queryFn: async () => unwrapApiResponse(await getPaymentsFeeSettings()) ?? null,
    enabled: Boolean(module),
    staleTime: 60_000,
  });

  const settings = fetchPaymentsFeeSettings.data;
  const active = !module || !settings ? true : settings[`${module}_fee_active`] !== false;

  return { active, loading: Boolean(module) && fetchPaymentsFeeSettings.isPending };
};
