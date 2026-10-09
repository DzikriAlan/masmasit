import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { unwrapApiResponse } from '@/shared/lib/apiResponse';

import {
  deleteBuilds,
  deleteBuildsLike,
  getBuilds,
  getBuildsLiked,
  patchBuilds,
  postBuilds,
  postBuildsLike,
} from '../services/buildsServices';
import type { PayloadPatchBuilds, PayloadPostBuilds } from '../types/buildsTypes';

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

  const getAffectedRows = <T,>(rows: T[] | null) => {
    if (!rows || rows.length === 0) throw new Error('You do not have permission to change this build.');
    return rows;
  };

  const modifyBuilds = useMutation({
    mutationFn: async ({ id, ...payload }: PayloadPatchBuilds & { id: string }) =>
      getAffectedRows(unwrapApiResponse(await patchBuilds(id, payload))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['builds'] });
      queryClient.invalidateQueries({ queryKey: ['spotlight'] });
    },
  });

  const removeBuilds = useMutation({
    mutationFn: async (id: string) => getAffectedRows(unwrapApiResponse(await deleteBuilds(id))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['builds'] });
      queryClient.invalidateQueries({ queryKey: ['spotlight'] });
    },
  });

  return { fetchBuilds, fetchBuildsLiked, storeBuilds, storeBuildsLike, removeBuildsLike, modifyBuilds, removeBuilds };
};
