import { useMutation, useQueryClient } from '@tanstack/react-query';

import { unwrapApiResponse } from '@/shared/lib/apiResponse';

import {
  updateProfile,
  updateProfileCoachApplication,
  updateProfileTalentApplication,
} from '../services/profileServices';
import type { PayloadPatchProfile } from '../types/profileTypes';

export const useProfileControllers = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  const changeProfile = useMutation({
    mutationFn: async (payload: PayloadPatchProfile) => {
      if (!userId) throw new Error('Missing user');
      return unwrapApiResponse(await updateProfile(userId, payload));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directory'] });
    },
  });

  const changeProfileTalentApplication = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Missing user');
      return unwrapApiResponse(await updateProfileTalentApplication(userId));
    },
  });

  const changeProfileCoachApplication = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Missing user');
      return unwrapApiResponse(await updateProfileCoachApplication(userId));
    },
  });

  return { changeProfile, changeProfileTalentApplication, changeProfileCoachApplication };
};
