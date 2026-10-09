'use client';

import { useEffect } from 'react';
import { useAuth } from '@/components/auth-provider';
import { cn } from '@/shared/lib/utils';

import {
  getMessagesUnreadRealtimeChannel,
  removeMessagesUnreadRealtimeChannel,
} from '@/features/messages/services/messagesServices';
import { useMessagesUnreadControllers } from '@/features/messages/controllers/messagesControllers';

/**
 * Total unread messages for the signed-in user. Refetches on every new message
 * to the user and on read-flag updates, so it clears as soon as a conversation
 * is opened. Renders nothing at zero.
 */
export function MessagesUnreadBadge({ className }: { className?: string }) {
  const { user } = useAuth();
  const { fetchMessagesUnreadCount } = useMessagesUnreadControllers(user?.id);
  const count = fetchMessagesUnreadCount.data ?? 0;

  const refetchUnread = fetchMessagesUnreadCount.refetch;
  useEffect(() => {
    if (!user) return;
    const channel = getMessagesUnreadRealtimeChannel(user.id, () => {
      refetchUnread();
    }).subscribe();
    return () => { removeMessagesUnreadRealtimeChannel(channel); };
  }, [user, refetchUnread]);

  if (!user || count <= 0) return null;

  return (
    <span
      className={cn(
        'flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground',
        className
      )}
    >
      {count > 9 ? '9+' : count}
    </span>
  );
}
