import { supabase } from '@/shared/lib/supabase';
import { API_ERROR_CODE, errorResponse, successResponse, toApiResponse } from '@/shared/lib/apiResponse';

import type {
  DataMessages,
  DataMessagesAttachment,
  DataMessagesConversation,
  DataMessagesPartner,
  PayloadPostMessages,
  PayloadPostMessagesAttachment,
} from '../types/messagesTypes';

const PARTNER_FIELDS = 'id, full_name, avatar_url, location';

const ATTACHMENT_BUCKET = 'message-attachments';
export const MESSAGES_ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024;

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

/** Total unread messages addressed to the user, for the navbar badge. */
export const getMessagesUnreadCount = async (userId: string) => {
  try {
    const { count, error } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('read', false);
    if (error) return errorResponse(API_ERROR_CODE.INTERNAL_SERVER_ERROR, error.message);
    return successResponse(count ?? 0, 'Unread count retrieved successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return errorResponse(API_ERROR_CODE.INTERNAL_SERVER_ERROR, message);
  }
};

/**
 * Uploads a chat attachment to the private bucket under
 * `{sender}/{recipient}/…` — the storage policies (029b) let the sender write
 * there and both participants read it. Returns the object path, not a URL:
 * the bucket is private, so readers resolve it with a signed URL.
 */
export const postMessagesAttachment = async (payload: PayloadPostMessagesAttachment) => {
  try {
    if (payload.file.size > MESSAGES_ATTACHMENT_MAX_BYTES) {
      return errorResponse(API_ERROR_CODE.VALIDATION_ERROR, 'File exceeds 5 MB');
    }
    const safeName = payload.file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${payload.sender_id}/${payload.recipient_id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
    const { error } = await supabase.storage
      .from(ATTACHMENT_BUCKET)
      .upload(path, payload.file, { cacheControl: '3600', upsert: false, contentType: payload.file.type || undefined });
    if (error) return errorResponse(API_ERROR_CODE.VALIDATION_ERROR, error.message);

    return successResponse<DataMessagesAttachment>(
      {
        attachment_url: path,
        attachment_name: payload.file.name,
        attachment_type: payload.file.type || 'application/octet-stream',
        attachment_size: payload.file.size,
      },
      'Attachment uploaded successfully'
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return errorResponse(API_ERROR_CODE.INTERNAL_SERVER_ERROR, message);
  }
};

/** Short-lived signed URL for a private attachment path. */
export const getMessagesAttachmentUrl = async (path: string) => {
  try {
    const { data, error } = await supabase.storage.from(ATTACHMENT_BUCKET).createSignedUrl(path, 60 * 60);
    if (error) return errorResponse(API_ERROR_CODE.NOT_FOUND, error.message);
    return successResponse(data.signedUrl, 'Attachment URL created successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return errorResponse(API_ERROR_CODE.INTERNAL_SERVER_ERROR, message);
  }
};

/**
 * Realtime INSERT stream on `messages`, scoped to the user's own messages.
 * Unfiltered, every open inbox received every message on the platform and
 * Realtime ran an RLS check per message per subscriber — cost that grows with
 * the square of active users. A filter takes a single condition, so sent and
 * received are two bindings. Kept in services because it is the same
 * transport as the rest of this feature's data access; the caller owns teardown.
 */
export const getMessagesRealtimeChannel = (userId: string, onInsert: (message: DataMessages) => void) => {
  const handle = (payload: { new: unknown }) => onInsert(payload.new as DataMessages);
  return supabase
    .channel(`messages:${userId}:${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `recipient_id=eq.${userId}` }, handle)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `sender_id=eq.${userId}` }, handle);
};

export const removeMessagesRealtimeChannel = (channel: ReturnType<typeof getMessagesRealtimeChannel>) => {
  supabase.removeChannel(channel);
};

/**
 * Realtime stream for the navbar unread badge: new messages to the user and
 * read-flag updates on them (opening a conversation marks it read).
 */
export const getMessagesUnreadRealtimeChannel = (userId: string, onChange: () => void) => {
  return supabase
    .channel(`messages-unread:${userId}:${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `recipient_id=eq.${userId}` }, onChange)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `recipient_id=eq.${userId}` }, onChange);
};

export const removeMessagesUnreadRealtimeChannel = (
  channel: ReturnType<typeof getMessagesUnreadRealtimeChannel>
) => {
  supabase.removeChannel(channel);
};
