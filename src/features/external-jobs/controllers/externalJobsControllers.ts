import { useQuery } from '@tanstack/react-query';

import { unwrapApiResponse } from '@/shared/lib/apiResponse';

import { getExternalJobs } from '../services/externalJobsServices';

export const useExternalJobsControllers = () => {
  // One request for the whole (cached, server-side) result set; search and
  // the country/role filters narrow it client-side rather than each
  // re-hitting the API — Remotive's own terms ask for infrequent requests.
  const fetchExternalJobs = useQuery({
    queryKey: ['externalJobs'],
    queryFn: async () => unwrapApiResponse(await getExternalJobs()) ?? [],
    staleTime: 60 * 60 * 1000,
  });

  return { fetchExternalJobs };
};
