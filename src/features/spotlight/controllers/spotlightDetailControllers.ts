import { useQuery } from '@tanstack/react-query';

import { unwrapApiResponse } from '@/shared/lib/apiResponse';

import { getSpotlightDetail } from '../services/spotlightDetailServices';

export const useSpotlightDetailControllers = (spotlightId: string | undefined) => {
  const fetchSpotlightDetail = useQuery({
    queryKey: ['spotlightDetail', spotlightId],
    queryFn: async () => unwrapApiResponse(await getSpotlightDetail(spotlightId as string)) ?? null,
    enabled: Boolean(spotlightId),
  });

  return { fetchSpotlightDetail };
};
