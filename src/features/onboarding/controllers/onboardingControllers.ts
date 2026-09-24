import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { SkillTag } from '@/components/skill-tag-input';

import { unwrapApiResponse } from '@/shared/lib/apiResponse';

import {
  deleteOnboardingExperiences,
  deleteOnboardingSkills,
  getOnboardingSkills,
  patchOnboardingAnswers,
  patchOnboardingSnooze,
  postOnboardingAgency,
  postOnboardingExperiences,
  postOnboardingProfile,
  postOnboardingRoles,
  postOnboardingSkills,
  postOnboardingSkillNames,
  postOnboardingSkillsMerge,
} from '../services/onboardingServices';
import type {
  PayloadPatchOnboardingAnswers,
  PayloadPatchOnboardingSnooze,
  PayloadPostOnboardingAgency,
  PayloadPostOnboardingExperiences,
  PayloadPostOnboardingProfile,
  PayloadPostOnboardingRoles,
  PayloadPostOnboardingSkills,
} from '../types/onboardingTypes';

export const useOnboardingControllers = (userId: string | undefined) => {
  const queryClient = useQueryClient();

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

  const modifyOnboardingAnswers = useMutation({
    mutationFn: async ({ skills, ...answers }: PayloadPatchOnboardingAnswers & { skills: SkillTag[] }) => {
      const ids = skills.flatMap((s) => (s.id ? [s.id] : []));
      const newNames = skills.filter((s) => !s.id).map((s) => s.name);
      if (newNames.length > 0) {
        const created = unwrapApiResponse(await postOnboardingSkillNames(newNames)) ?? [];
        ids.push(...created.map((s) => s.id));
      }
      if (ids.length > 0) {
        const rows = Array.from(new Set(ids)).map((skill_id) => ({ user_id: answers.id, skill_id, level: 'intermediate' }));
        unwrapApiResponse(await postOnboardingSkillsMerge(rows));
      }
      unwrapApiResponse(await patchOnboardingAnswers(answers));
      queryClient.invalidateQueries({ queryKey: ['onboardingSkills'] });
    },
  });

  const modifyOnboardingSnooze = useMutation({
    mutationFn: async (payload: PayloadPatchOnboardingSnooze) => unwrapApiResponse(await patchOnboardingSnooze(payload)),
  });

  return {
    fetchOnboardingSkills,
    modifyOnboardingAnswers,
    modifyOnboardingSnooze,
    storeOnboardingProfile,
    storeOnboardingSkills,
    storeOnboardingExperiences,
    storeOnboardingRoles,
    storeOnboardingAgency,
  };
};
