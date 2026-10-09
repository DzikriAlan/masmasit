import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { unwrapApiResponse } from '@/shared/lib/apiResponse';

import {
  deleteAgencyServices,
  getAgency,
  getAgencyDetail,
  getAgencyManage,
  patchAgencyManage,
  patchAgencyServices,
  postAgency,
  postAgencyServices,
} from '../services/agencyServices';
import type {
  PayloadPatchAgencyManage,
  PayloadPatchAgencyServices,
  PayloadPostAgency,
  PayloadPostAgencyServices,
} from '../types/agencyTypes';

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
  const queryClient = useQueryClient();

  const storeAgency = useMutation({
    mutationFn: async (payload: PayloadPostAgency) => unwrapApiResponse(await postAgency(payload)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agencyManage'] }),
  });

  return { storeAgency };
};

export const useAgencyManageControllers = (ownerId: string) => {
  const queryClient = useQueryClient();

  const getInvalidated = () => {
    queryClient.invalidateQueries({ queryKey: ['agencyManage'] });
    queryClient.invalidateQueries({ queryKey: ['agency'] });
    queryClient.invalidateQueries({ queryKey: ['agencyDetail'] });
  };

  const fetchAgencyManage = useQuery({
    queryKey: ['agencyManage', ownerId],
    queryFn: async () => unwrapApiResponse(await getAgencyManage(ownerId)) ?? [],
    enabled: Boolean(ownerId),
  });

  const modifyAgencyManage = useMutation({
    mutationFn: async (payload: PayloadPatchAgencyManage) => unwrapApiResponse(await patchAgencyManage(payload)),
    onSuccess: getInvalidated,
  });

  const storeAgencyServices = useMutation({
    mutationFn: async (payload: PayloadPostAgencyServices) => unwrapApiResponse(await postAgencyServices(payload)),
    onSuccess: getInvalidated,
  });

  const modifyAgencyServices = useMutation({
    mutationFn: async (payload: PayloadPatchAgencyServices) => unwrapApiResponse(await patchAgencyServices(payload)),
    onSuccess: getInvalidated,
  });

  const removeAgencyServices = useMutation({
    mutationFn: async (id: string) => unwrapApiResponse(await deleteAgencyServices(id)),
    onSuccess: getInvalidated,
  });

  return { fetchAgencyManage, modifyAgencyManage, storeAgencyServices, modifyAgencyServices, removeAgencyServices };
};
