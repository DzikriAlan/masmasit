import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { SkillTag } from '@/components/skill-tag-input';

import { unwrapApiResponse } from '@/shared/lib/apiResponse';

import {
  deleteProfileExperiences,
  deleteProfileSkills,
  getProfileExperiences,
  postProfileExperiences,
  updateProfileExperiences,
  getProfileSkillOptions,
  getProfileSkills,
  postProfileSkillNames,
  postProfileSkills,
  updateProfile,
  updateProfileCoachApplication,
  updateProfileTalentApplication,
} from '../services/profileServices';
import type { PayloadPatchProfile, PayloadProfileExperience } from '../types/profileTypes';

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

  const fetchProfileSkillOptions = useQuery({
    queryKey: ['profileSkillOptions'],
    queryFn: async () => unwrapApiResponse(await getProfileSkillOptions()) ?? [],
    enabled: !!userId,
  });

  const fetchProfileSkills = useQuery({
    queryKey: ['profileSkills', userId],
    queryFn: async () => unwrapApiResponse(await getProfileSkills(userId!)) ?? [],
    enabled: !!userId,
  });

  // Makes the member's skills exactly the given tags: creates missing
  // catalogue rows, adds new links, then drops links no longer listed.
  const modifyProfileSkills = useMutation({
    mutationFn: async (tags: SkillTag[]) => {
      if (!userId) throw new Error('Missing user');
      const ids = tags.flatMap((s) => (s.id ? [s.id] : []));
      const newNames = tags.filter((s) => !s.id).map((s) => s.name);
      if (newNames.length > 0) {
        const created = unwrapApiResponse(await postProfileSkillNames(newNames)) ?? [];
        ids.push(...created.map((s) => s.id));
      }
      const unique = Array.from(new Set(ids));
      if (unique.length > 0) unwrapApiResponse(await postProfileSkills(userId, unique));
      unwrapApiResponse(await deleteProfileSkills(userId, unique));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profileSkills', userId] });
      queryClient.invalidateQueries({ queryKey: ['profileSkillOptions'] });
      queryClient.invalidateQueries({ queryKey: ['directory'] });
    },
  });

  const fetchProfileExperiences = useQuery({
    queryKey: ['profileExperiences', userId],
    queryFn: async () => unwrapApiResponse(await getProfileExperiences(userId!)) ?? [],
    enabled: !!userId,
  });

  // Makes the member's experiences exactly the given list. Removed rows are
  // deleted, saved rows updated in place, new rows inserted — so a failed
  // insert never wipes what was already there.
  const modifyProfileExperiences = useMutation({
    mutationFn: async (items: PayloadProfileExperience[]) => {
      if (!userId) throw new Error('Missing user');
      const toRow = (e: PayloadProfileExperience) => ({
        company: e.company.trim(),
        position: e.position.trim(),
        start_date: e.start_date,
        end_date: e.end_date || null,
        description: e.description.trim() || null,
      });
      const existing = items.flatMap((e) => (e.id ? [{ id: e.id, ...toRow(e) }] : []));
      const added = items.filter((e) => !e.id).map(toRow);

      unwrapApiResponse(await deleteProfileExperiences(userId, existing.map((e) => e.id)));
      if (existing.length > 0) unwrapApiResponse(await updateProfileExperiences(userId, existing));
      if (added.length > 0) unwrapApiResponse(await postProfileExperiences(userId, added));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profileExperiences', userId] });
      queryClient.invalidateQueries({ queryKey: ['directoryDetail', userId] });
    },
  });

  return {
    fetchProfileExperiences,
    modifyProfileExperiences,
    changeProfile,
    changeProfileTalentApplication,
    changeProfileCoachApplication,
    fetchProfileSkillOptions,
    fetchProfileSkills,
    modifyProfileSkills,
  };
};
