import { useMutation, useQuery } from '@tanstack/react-query';

import { unwrapApiResponse } from '@/shared/lib/apiResponse';

import {
  deleteOnboardingExperiences,
  deleteOnboardingSkills,
  getOnboardingSkills,
  postOnboardingAgency,
  postOnboardingExperiences,
  postOnboardingProfile,
  postOnboardingRoles,
  postOnboardingSkills,
} from '../services/onboardingServices';
import type {
  PayloadPostOnboardingAgency,
  PayloadPostOnboardingExperiences,
  PayloadPostOnboardingProfile,
  PayloadPostOnboardingRoles,
  PayloadPostOnboardingSkills,
} from '../types/onboardingTypes';

export const useOnboardingControllers = (userId: string | undefined) => {
  const fetchOnboardingSkills = useQuery({
    queryKey: ['onboardingSkills'],
    queryFn: async () => unwrapApiResponse(await getOnboardingSkills()) ?? [],
  });

  const storeOnboardingProfile = useMutation({
    mutationFn: async (payload: PayloadPostOnboardingProfile) =>
      unwrapApiResponse(await postOnboardingProfile(payload)),
  });

  const storeOnboardingSkills = useMutation({
    mutationFn: async (payload: PayloadPostOnboardingSkills[]) => {
      if (!userId) throw new Error('Missing user');
      unwrapApiResponse(await deleteOnboardingSkills(userId));
      if (payload.length > 0) unwrapApiResponse(await postOnboardingSkills(payload));
    },
  });

  const storeOnboardingExperiences = useMutation({
    mutationFn: async (payload: PayloadPostOnboardingExperiences[]) => {
      if (!userId) throw new Error('Missing user');
      unwrapApiResponse(await deleteOnboardingExperiences(userId));
      if (payload.length > 0) unwrapApiResponse(await postOnboardingExperiences(payload));
    },
  });

  const storeOnboardingRoles = useMutation({
    mutationFn: async (payload: PayloadPostOnboardingRoles) => unwrapApiResponse(await postOnboardingRoles(payload)),
  });

  const storeOnboardingAgency = useMutation({
    mutationFn: async (payload: PayloadPostOnboardingAgency) => unwrapApiResponse(await postOnboardingAgency(payload)),
  });

  return {
    fetchOnboardingSkills,
    storeOnboardingProfile,
    storeOnboardingSkills,
    storeOnboardingExperiences,
    storeOnboardingRoles,
    storeOnboardingAgency,
  };
};
