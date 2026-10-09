import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { unwrapApiResponse } from '@/shared/lib/apiResponse';

import {
  getJobsEditable,
  getJobsLocations,
  getJobsMatchUserSkills,
  getJobsSkillsCatalog,
  getJobsTypes,
  updateJobs,
} from '../services/jobsEditServices';
import type { PayloadUpdateJobs } from '../types/jobsEditTypes';

/** Job types, locations and the skills catalogue for the post/edit form and filters. */
export const useJobsReferenceControllers = (withSkills = false) => {
  const fetchJobsTypes = useQuery({
    queryKey: ['jobsTypes'],
    queryFn: async () => unwrapApiResponse(await getJobsTypes()) ?? [],
    staleTime: 60 * 60 * 1000,
  });

  const fetchJobsLocations = useQuery({
    queryKey: ['jobsLocations'],
    queryFn: async () => unwrapApiResponse(await getJobsLocations()) ?? [],
    staleTime: 60 * 60 * 1000,
  });

  const fetchJobsSkillsCatalog = useQuery({
    queryKey: ['jobsSkillsCatalog'],
    queryFn: async () => unwrapApiResponse(await getJobsSkillsCatalog()) ?? [],
    enabled: withSkills,
    staleTime: 60 * 60 * 1000,
  });

  return { fetchJobsTypes, fetchJobsLocations, fetchJobsSkillsCatalog };
};

/** Employer edit of one posting. */
export const useJobsEditControllers = (jobId: string | null) => {
  const queryClient = useQueryClient();

  const fetchJobsEditable = useQuery({
    queryKey: ['jobsEditable', jobId],
    queryFn: async () => unwrapApiResponse(await getJobsEditable(jobId as string)) ?? null,
    enabled: Boolean(jobId),
  });

  const modifyJobs = useMutation({
    mutationFn: async (payload: PayloadUpdateJobs) => unwrapApiResponse(await updateJobs(jobId as string, payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobsEditable', jobId] });
      queryClient.invalidateQueries({ queryKey: ['jobsOwned'] });
      queryClient.invalidateQueries({ queryKey: ['jobsDetail', jobId] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  return { fetchJobsEditable, modifyJobs };
};

/** The member's skills by name, for the match score on job cards. */
export const useJobsMatchControllers = (userId: string | undefined) => {
  const fetchJobsMatchUserSkills = useQuery({
    queryKey: ['jobsMatchUserSkills', userId],
    queryFn: async () => unwrapApiResponse(await getJobsMatchUserSkills(userId as string)) ?? [],
    enabled: Boolean(userId),
  });

  return { fetchJobsMatchUserSkills };
};
