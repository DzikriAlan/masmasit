'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Link from 'next/link';

import type { DataNotifications } from '@/features/notifications/types/notificationsTypes';
import {
  getNotificationsRealtimeChannel,
  removeNotificationsRealtimeChannel,
} from '@/features/notifications/services/notificationsServices';
import { useNotificationsControllers } from '@/features/notifications/controllers/notificationsControllers';

type Notification = DataNotifications;

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(date).toLocaleDateString();
}

export function NotificationBell() {
  const { user } = useAuth();
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { fetchNotifications, changeNotificationsAllRead, changeNotificationsRead } =
    useNotificationsControllers(user?.id);

  const notifications: Notification[] = fetchNotifications.data ?? [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    if (!user) return;
    const channel = getNotificationsRealtimeChannel(user.id, () => {
      fetchNotifications.refetch();
    }).subscribe();

    return () => { removeNotificationsRealtimeChannel(channel); };
  }, [user, fetchNotifications]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const modifyAllRead = async () => {
    if (!user) return;
    try {
      await changeNotificationsAllRead.mutateAsync();
    } catch {
      toast.error(t('Failed to mark all as read', 'Gagal menandai semua sebagai dibaca'));
    }
  };

  const modifyOneRead = async (id: string) => {
    try {
      await changeNotificationsRead.mutateAsync(id);
    } catch {
      toast.error(t('Failed to mark as read', 'Gagal menandai sebagai dibaca'));
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-lg border border-border/60 bg-card shadow-xl animate-fade-up">
          <div className="flex items-center justify-between border-b border-border/40 p-3">
            <span className="text-sm font-semibold">{t('Notifications', 'Notifikasi')}</span>
            {unreadCount > 0 && (
              <button onClick={modifyAllRead} className="flex items-center gap-1 text-xs text-primary hover:underline">
                <CheckCheck className="h-3 w-3" /> {t('Mark all read', 'Tandai dibaca')}
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">{t('No notifications yet', 'Belum ada notifikasi')}</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex gap-3 border-b border-border/30 p-3 transition-colors hover:bg-muted/30 ${!n.is_read ? 'bg-primary/5' : ''}`}
                >
                  <div className="mt-0.5">
                    {!n.is_read && <span className="block h-2 w-2 rounded-full bg-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate">{n.title}</p>
                      <span className="text-xs text-muted-foreground shrink-0">{timeAgo(n.created_at)}</span>
                    </div>
                    {n.body && <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{n.body}</p>}
                    <div className="mt-1.5 flex items-center gap-2">
                      {n.link && (
                        <Link href={n.link} onClick={() => { modifyOneRead(n.id); setOpen(false); }}>
                          <span className="text-xs text-primary hover:underline">{t('View', 'Lihat')}</span>
                        </Link>
                      )}
                      {!n.is_read && (
                        <button onClick={() => modifyOneRead(n.id)} className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground">
                          <Check className="h-3 w-3" /> {t('Read', 'Dibaca')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
