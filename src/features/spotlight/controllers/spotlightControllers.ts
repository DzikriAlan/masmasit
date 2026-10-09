import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { unwrapApiResponse } from '@/shared/lib/apiResponse';
import type { PayloadPatchBuilds } from '@/features/builds/types/buildsTypes';

import {
  deleteSpotlight,
  deleteSpotlightLike,
  getSpotlight,
  getSpotlightAgenciesOwned,
  getSpotlightLiked,
  patchSpotlight,
  postSpotlight,
  postSpotlightLike,
} from '../services/spotlightServices';
import type { DataSpotlight, PayloadPostSpotlight } from '../types/spotlightTypes';

export const useSpotlightControllers = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  const fetchSpotlight = useQuery({
    queryKey: ['spotlight'],
    queryFn: async () => unwrapApiResponse(await getSpotlight()) ?? [],
  });

  const fetchSpotlightAgenciesOwned = useQuery({
    queryKey: ['spotlightAgenciesOwned', userId],
    queryFn: async () => unwrapApiResponse(await getSpotlightAgenciesOwned(userId as string)) ?? [],
    enabled: Boolean(userId),
  });

  const fetchSpotlightLiked = useQuery({
    queryKey: ['buildsLiked', userId],
    queryFn: async () => unwrapApiResponse(await getSpotlightLiked(userId as string)) ?? [],
    enabled: Boolean(userId),
  });

  const storeSpotlight = useMutation({
    mutationFn: async (payload: PayloadPostSpotlight) => unwrapApiResponse(await postSpotlight(payload)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['spotlight'] }),
  });

  // Optimistic like/unlike: the counter and heart flip immediately, then the
  // trigger-maintained likes_count is re-read from the server.
  const getOptimisticLike = async (buildId: string, delta: 1 | -1) => {
    await queryClient.cancelQueries({ queryKey: ['spotlight'] });
    await queryClient.cancelQueries({ queryKey: ['buildsLiked', userId] });
    const previousSpotlight = queryClient.getQueryData<DataSpotlight[]>(['spotlight']);
    const previousLiked = queryClient.getQueryData<{ build_id: string }[]>(['buildsLiked', userId]);

    queryClient.setQueryData<DataSpotlight[]>(['spotlight'], (old: DataSpotlight[] | undefined) =>
      (old ?? []).map((item: DataSpotlight) =>
        item.id === buildId ? { ...item, likes_count: Math.max(0, item.likes_count + delta) } : item
      )
    );
    queryClient.setQueryData<{ build_id: string }[]>(['buildsLiked', userId], (old: { build_id: string }[] | undefined) =>
      delta > 0 ? [...(old ?? []), { build_id: buildId }] : (old ?? []).filter((like: { build_id: string }) => like.build_id !== buildId)
    );

    return { previousSpotlight, previousLiked };
  };

  const getRolledBackLike = (context?: { previousSpotlight?: DataSpotlight[]; previousLiked?: { build_id: string }[] }) => {
    if (!context) return;
    queryClient.setQueryData(['spotlight'], context.previousSpotlight);
    queryClient.setQueryData(['buildsLiked', userId], context.previousLiked);
  };

  const getSettledLike = () => {
    queryClient.invalidateQueries({ queryKey: ['spotlight'] });
    queryClient.invalidateQueries({ queryKey: ['builds'] });
    queryClient.invalidateQueries({ queryKey: ['buildsLiked', userId] });
  };

  const storeSpotlightLike = useMutation({
    mutationFn: async (buildId: string) => unwrapApiResponse(await postSpotlightLike(buildId, userId as string)),
    onMutate: (buildId: string) => getOptimisticLike(buildId, 1),
    onError: (_error, _buildId, context) => getRolledBackLike(context),
    onSettled: getSettledLike,
  });

  const removeSpotlightLike = useMutation({
    mutationFn: async (buildId: string) => unwrapApiResponse(await deleteSpotlightLike(buildId, userId as string)),
    onMutate: (buildId: string) => getOptimisticLike(buildId, -1),
    onError: (_error, _buildId, context) => getRolledBackLike(context),
    onSettled: getSettledLike,
  });

  const getAffectedRows = <T,>(rows: T[] | null) => {
    if (!rows || rows.length === 0) throw new Error('You do not have permission to change this entry.');
    return rows;
  };

  const modifySpotlight = useMutation({
    mutationFn: async ({ id, ...payload }: PayloadPatchBuilds & { id: string }) =>
      getAffectedRows(unwrapApiResponse(await patchSpotlight(id, payload))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spotlight'] });
      queryClient.invalidateQueries({ queryKey: ['builds'] });
    },
  });

  const removeSpotlight = useMutation({
    mutationFn: async (id: string) => getAffectedRows(unwrapApiResponse(await deleteSpotlight(id))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spotlight'] });
      queryClient.invalidateQueries({ queryKey: ['builds'] });
    },
  });

  return {
    fetchSpotlight,
    fetchSpotlightAgenciesOwned,
    fetchSpotlightLiked,
    storeSpotlight,
    storeSpotlightLike,
    removeSpotlightLike,
    modifySpotlight,
    removeSpotlight,
  };
};
