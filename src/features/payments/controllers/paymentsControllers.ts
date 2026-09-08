import { useMutation, useQueryClient } from '@tanstack/react-query';

import { unwrapApiResponse } from '@/shared/lib/apiResponse';

import { updatePaymentsConfirmation } from '../services/paymentsServices';
import type { PayloadPatchPaymentsConfirmation } from '../types/paymentsTypes';

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
