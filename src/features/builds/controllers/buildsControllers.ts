import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { unwrapApiResponse } from '@/shared/lib/apiResponse';

import { deleteBuildsLike, getBuilds, getBuildsLiked, postBuilds, postBuildsLike } from '../services/buildsServices';
import type { PayloadPostBuilds } from '../types/buildsTypes';

export const useBuildsControllers = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  const fetchBuilds = useQuery({
    queryKey: ['builds'],
    queryFn: async () => unwrapApiResponse(await getBuilds()) ?? [],
  });

  const fetchBuildsLiked = useQuery({
    queryKey: ['buildsLiked', userId],
    queryFn: async () => unwrapApiResponse(await getBuildsLiked(userId as string)) ?? [],
    enabled: Boolean(userId),
  });

  const storeBuilds = useMutation({
    mutationFn: async (payload: PayloadPostBuilds) => unwrapApiResponse(await postBuilds(payload)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['builds'] }),
  });

  const storeBuildsLike = useMutation({
    mutationFn: async (buildId: string) => unwrapApiResponse(await postBuildsLike(buildId, userId as string)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['builds'] });
      queryClient.invalidateQueries({ queryKey: ['buildsLiked', userId] });
    },
  });

  const removeBuildsLike = useMutation({
    mutationFn: async (buildId: string) => unwrapApiResponse(await deleteBuildsLike(buildId, userId as string)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['builds'] });
      queryClient.invalidateQueries({ queryKey: ['buildsLiked', userId] });
    },
  });

  return { fetchBuilds, fetchBuildsLiked, storeBuilds, storeBuildsLike, removeBuildsLike };
};
