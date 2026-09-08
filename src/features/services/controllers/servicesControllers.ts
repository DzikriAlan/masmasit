import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { unwrapApiResponse } from '@/shared/lib/apiResponse';

import { getServices, postServicesRequest } from '../services/servicesServices';
import type { PayloadPostServicesRequest } from '../types/servicesTypes';

export const useServicesControllers = () => {
  const queryClient = useQueryClient();

  const fetchServices = useQuery({
    queryKey: ['services'],
    queryFn: async () => unwrapApiResponse(await getServices()) ?? [],
  });

  const storeServicesRequest = useMutation({
    mutationFn: async (payload: PayloadPostServicesRequest) =>
      unwrapApiResponse(await postServicesRequest(payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });

  return { fetchServices, storeServicesRequest };
};
