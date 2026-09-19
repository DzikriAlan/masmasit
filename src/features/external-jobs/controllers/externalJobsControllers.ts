import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { unwrapApiResponse } from '@/shared/lib/apiResponse';

import { getExternalJobs } from '../services/externalJobsServices';

export const useExternalJobsControllers = (query = '') => {
  // `query` is the scrape query: it is forwarded to Remotive (server-side,
  // cached ~1h per query, never stored in our DB). Country/role filters
  // narrow the returned batch client-side, so only a new query re-hits the API.
  const fetchExternalJobs = useQuery({
    queryKey: ['externalJobs', query],
    queryFn: async () => unwrapApiResponse(await getExternalJobs(query)) ?? [],
    staleTime: 60 * 60 * 1000,
    placeholderData: keepPreviousData,
  });

  return { fetchExternalJobs };
};
