import { supabase } from '@/shared/lib/supabase';
import { toApiResponse } from '@/shared/lib/apiResponse';

import type { DataNotifications } from '../types/notificationsTypes';

export const getNotifications = async (userId: string) => {
  return toApiResponse<DataNotifications[]>(
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10),
    'Notifications retrieved successfully'
  );
};

export const updateNotificationsAllRead = async (userId: string) => {
  return toApiResponse<null>(
    supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false),
    'Notifications marked as read successfully'
  );
};

export const updateNotificationsRead = async (id: string) => {
  return toApiResponse<null>(
    supabase.from('notifications').update({ is_read: true }).eq('id', id),
    'Notification marked as read successfully'
  );
};

/**
 * Realtime INSERT stream, scoped to one user. The topic carries a random
 * suffix because reusing a cached channel name and calling .on() after
 * .subscribe() throws under StrictMode re-renders.
 */
export const getNotificationsRealtimeChannel = (userId: string, onInsert: () => void) => {
  return supabase
    .channel(`notifications:${userId}:${Math.random().toString(36).slice(2)}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
      onInsert
    );
};

export const removeNotificationsRealtimeChannel = (
  channel: ReturnType<typeof getNotificationsRealtimeChannel>
) => {
  supabase.removeChannel(channel);
};
