import { useMutation } from '@tanstack/react-query';

import { unwrapApiResponse } from '@/shared/lib/apiResponse';

import {
  getAuthProfile,
  getAuthUser,
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

  /**
   * Post-login landing depends on whether onboarding was completed, so the
   * profile is read on demand rather than cached as a query.
   */
  const fetchAuthLandingRoute = async () => {
    const user = unwrapApiResponse(await getAuthUser());
    if (!user?.id) return '/onboarding';
    const profile = unwrapApiResponse(await getAuthProfile(user.id));
    return profile?.full_name ? '/dashboard' : '/onboarding';
  };

  return { storeAuthPasswordReset, changeAuthPassword, fetchAuthLandingRoute };
};
