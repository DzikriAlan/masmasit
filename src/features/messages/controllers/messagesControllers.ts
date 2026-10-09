import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { unwrapApiResponse } from '@/shared/lib/apiResponse';

import {
  getMessagesAttachmentUrl,
  getMessagesConversations,
  getMessagesMemberSearch,
  getMessagesPartner,
  getMessagesThread,
  getMessagesUnreadCount,
  postMessages,
  postMessagesAttachment,
  updateMessagesRead,
} from '../services/messagesServices';
import type { PayloadPostMessages, PayloadPostMessagesAttachment } from '../types/messagesTypes';

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
      queryClient.invalidateQueries({ queryKey: ['messagesUnreadCount', userId] });
    },
  });

  const storeMessagesAttachment = useMutation({
    mutationFn: async (payload: PayloadPostMessagesAttachment) =>
      unwrapApiResponse(await postMessagesAttachment(payload)),
  });

  return {
    fetchMessagesConversations,
    fetchMessagesThread,
    fetchMessagesMemberSearch,
    storeMessages,
    storeMessagesAttachment,
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

/** Navbar badge: total unread messages for the signed-in user. */
export const useMessagesUnreadControllers = (userId: string | undefined) => {
  const fetchMessagesUnreadCount = useQuery({
    queryKey: ['messagesUnreadCount', userId],
    queryFn: async () => unwrapApiResponse(await getMessagesUnreadCount(userId as string)) ?? 0,
    enabled: Boolean(userId),
  });

  return { fetchMessagesUnreadCount };
};

/** Signed URL for one private attachment; cached just under its 1 h expiry. */
export const useMessagesAttachmentControllers = (path: string | null) => {
  const fetchMessagesAttachmentUrl = useQuery({
    queryKey: ['messagesAttachmentUrl', path],
    queryFn: async () => unwrapApiResponse(await getMessagesAttachmentUrl(path as string)) ?? null,
    enabled: Boolean(path),
    staleTime: 50 * 60 * 1000,
  });

  return { fetchMessagesAttachmentUrl };
};
