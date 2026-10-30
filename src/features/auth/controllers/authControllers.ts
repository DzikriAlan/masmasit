import { useMutation } from '@tanstack/react-query';

import { unwrapApiResponse } from '@/shared/lib/apiResponse';

import {
  postAuthPasswordReset,
  updateAuthPassword,
} from '../services/authServices';
import type { PayloadPatchAuthPassword, PayloadPostAuthPasswordReset } from '../types/authTypes';

export const useAuthControllers = () => {
  const storeAuthPasswordReset = useMutation({
    mutationFn: async (payload: PayloadPostAuthPasswordReset) =>
      unwrapApiResponse(await postAuthPasswordReset(payload)),
  });

  const changeAuthPassword = useMutation({
    mutationFn: async (payload: PayloadPatchAuthPassword) =>
      unwrapApiResponse(await updateAuthPassword(payload)),
  });

  const fetchAuthLandingRoute = async () => '/dashboard';

  return { storeAuthPasswordReset, changeAuthPassword, fetchAuthLandingRoute };
};
