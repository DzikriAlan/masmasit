import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { unwrapApiResponse } from '@/shared/lib/apiResponse';

import { getTeamCollabs, postTeamCollabs, updateTeamCollabsWithdraw } from '../services/teamCollabsServices';
import type { PayloadPostTeamCollabs } from '../types/teamCollabsTypes';

export const useTeamCollabsControllers = () => {
  const queryClient = useQueryClient();

  const fetchTeamCollabs = useQuery({
    queryKey: ['teamCollabs'],
    queryFn: async () => unwrapApiResponse(await getTeamCollabs()) ?? [],
  });

  const storeTeamCollabs = useMutation({
    mutationFn: async (payload: PayloadPostTeamCollabs) => unwrapApiResponse(await postTeamCollabs(payload)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teamCollabs'] }),
  });

  const changeTeamCollabsWithdraw = useMutation({
    mutationFn: async (id: string) => unwrapApiResponse(await updateTeamCollabsWithdraw(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teamCollabs'] }),
  });

  return { fetchTeamCollabs, storeTeamCollabs, changeTeamCollabsWithdraw };
};
