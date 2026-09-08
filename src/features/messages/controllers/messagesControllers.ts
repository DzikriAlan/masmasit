import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { unwrapApiResponse } from '@/shared/lib/apiResponse';

import {
  getMessagesConversations,
  getMessagesMemberSearch,
  getMessagesPartner,
  getMessagesThread,
  postMessages,
  updateMessagesRead,
} from '../services/messagesServices';
import type { PayloadPostMessages } from '../types/messagesTypes';

export const useMessagesControllers = (
  userId: string | undefined,
  partnerId: string | null,
  searchQuery: string
) => {
  const queryClient = useQueryClient();

  const fetchMessagesConversations = useQuery({
    queryKey: ['messagesConversations', userId],
    queryFn: async () => unwrapApiResponse(await getMessagesConversations(userId as string)) ?? [],
    enabled: Boolean(userId),
  });

  const fetchMessagesThread = useQuery({
    queryKey: ['messagesThread', userId, partnerId],
    queryFn: async () => unwrapApiResponse(await getMessagesThread(userId as string, partnerId as string)) ?? [],
    enabled: Boolean(userId && partnerId),
  });

  const fetchMessagesMemberSearch = useQuery({
    queryKey: ['messagesMemberSearch', userId, searchQuery],
    queryFn: async () => unwrapApiResponse(await getMessagesMemberSearch(searchQuery, userId as string)) ?? [],
    enabled: Boolean(userId) && searchQuery.trim().length >= 2,
  });

  const storeMessages = useMutation({
    mutationFn: async (payload: PayloadPostMessages) => unwrapApiResponse(await postMessages(payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messagesThread', userId] });
      queryClient.invalidateQueries({ queryKey: ['messagesConversations', userId] });
    },
  });

  const changeMessagesRead = useMutation({
    mutationFn: async (payload: { senderId: string; recipientId: string }) =>
      unwrapApiResponse(await updateMessagesRead(payload.senderId, payload.recipientId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messagesConversations', userId] });
    },
  });

  return {
    fetchMessagesConversations,
    fetchMessagesThread,
    fetchMessagesMemberSearch,
    storeMessages,
    changeMessagesRead,
  };
};

export const useMessagesPartnerControllers = (partnerId: string | null) => {
  const fetchMessagesPartner = useQuery({
    queryKey: ['messagesPartner', partnerId],
    queryFn: async () => unwrapApiResponse(await getMessagesPartner(partnerId as string)) ?? null,
    enabled: Boolean(partnerId),
  });

  return { fetchMessagesPartner };
};
