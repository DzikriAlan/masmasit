import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { unwrapApiResponse } from '@/shared/lib/apiResponse';

import {
  deleteTeamBuilderMembers,
  getTeamBuilder,
  getTeamBuilderDetail,
  getTeamBuilderMembersSearch,
  getTeamBuilderRoster,
  postTeamBuilder,
  postTeamBuilderMembers,
} from '../services/teamBuilderServices';
import type { PayloadPostTeamBuilder, PayloadPostTeamBuilderMembers } from '../types/teamBuilderTypes';

export const useTeamBuilderControllers = () => {
  const queryClient = useQueryClient();

  const fetchTeamBuilder = useQuery({
    queryKey: ['teamBuilder'],
    queryFn: async () => unwrapApiResponse(await getTeamBuilder()) ?? [],
  });

  const storeTeamBuilder = useMutation({
    mutationFn: async (payload: PayloadPostTeamBuilder) => unwrapApiResponse(await postTeamBuilder(payload)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teamBuilder'] }),
  });

  return { fetchTeamBuilder, storeTeamBuilder };
};

export const useTeamBuilderDetailControllers = (teamId: string) => {
  const queryClient = useQueryClient();

  const fetchTeamBuilderDetail = useQuery({
    queryKey: ['teamBuilderDetail', teamId],
    queryFn: async () => unwrapApiResponse(await getTeamBuilderDetail(teamId)) ?? null,
    enabled: Boolean(teamId),
  });

  const fetchTeamBuilderRoster = useQuery({
    queryKey: ['teamBuilderRoster', teamId],
    queryFn: async () => unwrapApiResponse(await getTeamBuilderRoster(teamId)) ?? [],
    enabled: Boolean(teamId),
  });

  const storeTeamBuilderMembers = useMutation({
    mutationFn: async (payload: PayloadPostTeamBuilderMembers) => unwrapApiResponse(await postTeamBuilderMembers(payload)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teamBuilderRoster', teamId] }),
  });

  const removeTeamBuilderMembers = useMutation({
    mutationFn: async (memberId: string) => unwrapApiResponse(await deleteTeamBuilderMembers(memberId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teamBuilderRoster', teamId] }),
  });

  return { fetchTeamBuilderDetail, fetchTeamBuilderRoster, storeTeamBuilderMembers, removeTeamBuilderMembers };
};

export const useTeamBuilderMembersSearchControllers = (query: string) => {
  const fetchTeamBuilderMembersSearch = useQuery({
    queryKey: ['teamBuilderMembersSearch', query],
    queryFn: async () => unwrapApiResponse(await getTeamBuilderMembersSearch(query)) ?? [],
    enabled: query.length >= 2,
  });

  return { fetchTeamBuilderMembersSearch };
};
