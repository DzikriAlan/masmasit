import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { unwrapApiResponse } from '@/shared/lib/apiResponse';

import {
  getActivityCourses,
  getActivityEvents,
  getActivityJobs,
  getActivityProjects,
  getActivityRequests,
  getActivityTeams,
  postActivityRequestPayment,
} from '../services/activityServices';
import type { PayloadPostActivityRequestPayment } from '../types/activityTypes';

export const useActivityControllers = (userId: string | undefined) => {
  const queryClient = useQueryClient();
  const enabled = Boolean(userId);

  const fetchActivityCourses = useQuery({
    queryKey: ['activityCourses', userId],
    queryFn: async () => unwrapApiResponse(await getActivityCourses(userId as string)) ?? [],
    enabled,
  });

  const fetchActivityProjects = useQuery({
    queryKey: ['activityProjects', userId],
    queryFn: async () => unwrapApiResponse(await getActivityProjects(userId as string)) ?? { posted: [], bids: [] },
    enabled,
  });

  const fetchActivityEvents = useQuery({
    queryKey: ['activityEvents', userId],
    queryFn: async () => unwrapApiResponse(await getActivityEvents(userId as string)) ?? [],
    enabled,
  });

  const fetchActivityTeams = useQuery({
    queryKey: ['activityTeams', userId],
    queryFn: async () =>
      unwrapApiResponse(await getActivityTeams(userId as string)) ?? { owned: [], joined: [], collabs: [] },
    enabled,
  });

  const fetchActivityRequests = useQuery({
    queryKey: ['activityRequests', userId],
    queryFn: async () => unwrapApiResponse(await getActivityRequests(userId as string)) ?? { requests: [], fallbackUrl: null },
    enabled,
    retry: false,
  });

  const fetchActivityJobs = useQuery({
    queryKey: ['activityJobs', userId],
    queryFn: async () => unwrapApiResponse(await getActivityJobs(userId as string)) ?? { company: null, jobs: [] },
    enabled,
  });

  const storeActivityRequestPayment = useMutation({
    mutationFn: async (payload: PayloadPostActivityRequestPayment) =>
      unwrapApiResponse(await postActivityRequestPayment(payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activityRequests', userId] });
      queryClient.invalidateQueries({ queryKey: ['adminPayments'] });
    },
  });

  return {
    fetchActivityCourses,
    fetchActivityProjects,
    fetchActivityEvents,
    fetchActivityTeams,
    fetchActivityRequests,
    fetchActivityJobs,
    storeActivityRequestPayment,
  };
};
