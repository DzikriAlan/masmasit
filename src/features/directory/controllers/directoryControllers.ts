import { useQuery } from '@tanstack/react-query';

import { unwrapApiResponse } from '@/shared/lib/apiResponse';

import { useDirectoryStates } from '../states/directoryStates';
import { getDirectory, getDirectoryDetail, getDirectorySkills } from '../services/directoryServices';

export const useDirectoryControllers = () => {
  const { payloadGetDirectory, setGetDirectory } = useDirectoryStates();

  const fetchDirectorySkills = useQuery({
    queryKey: ['directorySkills'],
    queryFn: async () => unwrapApiResponse(await getDirectorySkills()) ?? [],
  });

  const fetchDirectory = useQuery({
    queryKey: ['directory', payloadGetDirectory],
    queryFn: async () => unwrapApiResponse(await getDirectory(payloadGetDirectory)) ?? [],
  });

  return { fetchDirectorySkills, fetchDirectory, payloadGetDirectory, setGetDirectory };
};

export const useDirectoryDetailControllers = (id: string, isSignedIn = false) => {
  const fetchDirectoryDetail = useQuery({
    queryKey: ['directoryDetail', id, isSignedIn],
    queryFn: async () => unwrapApiResponse(await getDirectoryDetail(id, isSignedIn)) ?? null,
    enabled: Boolean(id),
  });

  return { fetchDirectoryDetail };
};
