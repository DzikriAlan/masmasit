import { useMutation, useQuery } from '@tanstack/react-query';

import { unwrapApiResponse } from '@/shared/lib/apiResponse';

import { getAgency, getAgencyDetail, postAgency } from '../services/agencyServices';
import type { PayloadPostAgency } from '../types/agencyTypes';

export const useAgencyControllers = () => {
  const fetchAgency = useQuery({
    queryKey: ['agency'],
    queryFn: async () => unwrapApiResponse(await getAgency()) ?? [],
  });

  return { fetchAgency };
};

export const useAgencyDetailControllers = (slug: string) => {
  const fetchAgencyDetail = useQuery({
    queryKey: ['agencyDetail', slug],
    queryFn: async () => unwrapApiResponse(await getAgencyDetail(slug)) ?? null,
    enabled: Boolean(slug),
  });

  return { fetchAgencyDetail };
};

export const useAgencyRegisterControllers = () => {
  const storeAgency = useMutation({
    mutationFn: async (payload: PayloadPostAgency) => unwrapApiResponse(await postAgency(payload)),
  });

  return { storeAgency };
};
