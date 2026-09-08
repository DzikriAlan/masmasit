import { supabase } from '@/shared/lib/supabase';
import { API_ERROR_CODE, errorResponse, successResponse, toApiResponse } from '@/shared/lib/apiResponse';

import type {
  DataMessages,
  DataMessagesConversation,
  DataMessagesPartner,
  PayloadPostMessages,
} from '../types/messagesTypes';

const PARTNER_FIELDS = 'id, full_name, avatar_url, location';

export const getMessagesConversations = async (userId: string) => {
  try {
    const [sent, received] = await Promise.all([
      supabase.from('messages').select('*').eq('sender_id', userId).order('created_at', { ascending: false }),
      supabase.from('messages').select('*').eq('recipient_id', userId).order('created_at', { ascending: false }),
    ]);

    const allMessages = [...(sent.data ?? []), ...(received.data ?? [])] as DataMessages[];
    const partnerIds = new Set<string>();
    allMessages.forEach((m) => {
      if (m.sender_id !== userId) partnerIds.add(m.sender_id);
      if (m.recipient_id !== userId) partnerIds.add(m.recipient_id);
    });

    if (partnerIds.size === 0) {
      return successResponse([] as DataMessagesConversation[], 'Conversations retrieved successfully');
    }

    // One query for every partner instead of one per conversation.
    const { data: partners, error: partnersError } = await supabase
      .from('profiles')
      .select(PARTNER_FIELDS)
      .in('id', Array.from(partnerIds));

    if (partnersError) {
      return errorResponse(API_ERROR_CODE.INTERNAL_SERVER_ERROR, partnersError.message);
    }

    const conversations: DataMessagesConversation[] = (partners ?? []).map((partner) => {
      const partnerId = (partner as DataMessagesPartner).id;
      const thread = allMessages
        .filter((m) => m.sender_id === partnerId || m.recipient_id === partnerId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const unreadCount =
        (received.data as DataMessages[] | null)?.filter((m) => m.sender_id === partnerId && !m.read).length ?? 0;

      return {
        partner: partner as DataMessagesPartner,
        lastMessage: thread[0] ?? null,
        unreadCount,
      };
    });

    conversations.sort((a, b) => {
      const aTime = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0;
      const bTime = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0;
      return bTime - aTime;
    });

    return successResponse(conversations, 'Conversations retrieved successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return errorResponse(API_ERROR_CODE.INTERNAL_SERVER_ERROR, message);
  }
};

export const getMessagesThread = async (userId: string, partnerId: string) => {
  return toApiResponse<DataMessages[]>(
    supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userId},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${userId}))`)
      .order('created_at', { ascending: true }),
    'Messages retrieved successfully'
  );
};

export const getMessagesPartner = async (partnerId: string) => {
  return toApiResponse<DataMessagesPartner>(
    supabase.from('profiles').select(PARTNER_FIELDS).eq('id', partnerId).maybeSingle(),
    'Partner retrieved successfully'
  );
};

export const getMessagesMemberSearch = async (query: string, userId: string) => {
  return toApiResponse<DataMessagesPartner[]>(
    supabase
      .from('profiles')
      .select(PARTNER_FIELDS)
      .ilike('full_name', `%${query}%`)
      .neq('id', userId)
      .limit(10),
    'Members retrieved successfully'
  );
};

export const updateMessagesRead = async (senderId: string, recipientId: string) => {
  return toApiResponse<null>(
    supabase
      .from('messages')
      .update({ read: true })
      .eq('sender_id', senderId)
      .eq('recipient_id', recipientId)
      .eq('read', false),
    'Messages marked as read successfully'
  );
};

export const updateMessagesReadById = async (messageId: string) => {
  return toApiResponse<null>(
    supabase.from('messages').update({ read: true }).eq('id', messageId),
    'Message marked as read successfully'
  );
};

export const postMessages = async (payload: PayloadPostMessages) => {
  return toApiResponse<null>(supabase.from('messages').insert(payload), 'Message sent successfully');
};

/**
 * Realtime INSERT stream on `messages`. Kept in services because it is the same
 * transport as the rest of this feature's data access; the caller owns teardown.
 */
export const getMessagesRealtimeChannel = (onInsert: (message: DataMessages) => void) => {
  return supabase
    .channel('messages-realtime')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
      onInsert(payload.new as DataMessages);
    });
};

export const removeMessagesRealtimeChannel = (channel: ReturnType<typeof getMessagesRealtimeChannel>) => {
  supabase.removeChannel(channel);
};
