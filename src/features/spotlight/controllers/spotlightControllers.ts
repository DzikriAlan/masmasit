import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { unwrapApiResponse } from '@/shared/lib/apiResponse';

import { getSpotlight, getSpotlightAgenciesOwned, postSpotlight } from '../services/spotlightServices';
import type { PayloadPostSpotlight } from '../types/spotlightTypes';

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

  const storeSpotlight = useMutation({
    mutationFn: async (payload: PayloadPostSpotlight) => unwrapApiResponse(await postSpotlight(payload)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['spotlight'] }),
  });

  return { fetchSpotlight, fetchSpotlightAgenciesOwned, storeSpotlight };
};
