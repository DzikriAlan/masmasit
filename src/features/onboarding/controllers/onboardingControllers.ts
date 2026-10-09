import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { SkillTag } from '@/components/skill-tag-input';

import { unwrapApiResponse } from '@/shared/lib/apiResponse';

import {
  deleteOnboardingExperiences,
  deleteOnboardingSkills,
  getOnboardingExperiences,
  getOnboardingSkills,
  getOnboardingUserSkills,
  patchOnboardingAnswers,
  patchOnboardingCompleted,
  patchOnboardingSnooze,
  postOnboardingAgency,
  postOnboardingExperiences,
  postOnboardingProfile,
  postOnboardingRoles,
  postOnboardingSkills,
  postOnboardingSkillNames,
  postOnboardingSkillsMerge,
  updateOnboardingExperiences,
} from '../services/onboardingServices';
import type {
  PayloadOnboardingExperience,
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

  const fetchOnboardingUserSkills = useQuery({
    queryKey: ['onboardingUserSkills', userId],
    queryFn: async () => unwrapApiResponse(await getOnboardingUserSkills(userId as string)) ?? [],
    enabled: Boolean(userId),
  });

  const fetchOnboardingExperiences = useQuery({
    queryKey: ['onboardingExperiences', userId],
    queryFn: async () => unwrapApiResponse(await getOnboardingExperiences(userId as string)) ?? [],
    enabled: Boolean(userId),
  });

  // Makes the member's skills exactly the list: upsert first (adds new ones,
  // updates levels), then drop only the ones removed — never a blanket wipe.
  const storeOnboardingSkills = useMutation({
    mutationFn: async (payload: PayloadPostOnboardingSkills[]) => {
      if (!userId) throw new Error('Missing user');
      if (payload.length > 0) unwrapApiResponse(await postOnboardingSkills(payload));
      unwrapApiResponse(await deleteOnboardingSkills(userId, payload.map((s) => s.skill_id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboardingUserSkills', userId] });
      queryClient.invalidateQueries({ queryKey: ['profileSkills', userId] });
    },
  });

  // Same diff for experiences: saved rows updated in place, new rows
  // inserted, removed rows deleted.
  const storeOnboardingExperiences = useMutation({
    mutationFn: async (items: PayloadOnboardingExperience[]) => {
      if (!userId) throw new Error('Missing user');
      const toRow = (e: PayloadOnboardingExperience): PayloadPostOnboardingExperiences => ({
        user_id: userId,
        company: e.company.trim(),
        position: e.position.trim(),
        start_date: e.start_date,
        end_date: e.end_date || null,
        description: e.description.trim(),
      });
      const existing = items.flatMap((e) => (e.id ? [{ ...toRow(e), id: e.id }] : []));
      const added = items.filter((e) => !e.id).map(toRow);

      unwrapApiResponse(await deleteOnboardingExperiences(userId, existing.map((e) => e.id)));
      if (existing.length > 0) unwrapApiResponse(await updateOnboardingExperiences(existing));
      if (added.length > 0) unwrapApiResponse(await postOnboardingExperiences(added));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboardingExperiences', userId] });
      queryClient.invalidateQueries({ queryKey: ['profileExperiences', userId] });
    },
  });

  const modifyOnboardingCompleted = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Missing user');
      return unwrapApiResponse(await patchOnboardingCompleted(userId));
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
    fetchOnboardingUserSkills,
    fetchOnboardingExperiences,
    modifyOnboardingAnswers,
    modifyOnboardingCompleted,
    modifyOnboardingSnooze,
    storeOnboardingProfile,
    storeOnboardingSkills,
    storeOnboardingExperiences,
    storeOnboardingRoles,
    storeOnboardingAgency,
  };
};
