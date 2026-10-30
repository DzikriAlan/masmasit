'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { BellRing, Share, X } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { Button } from '@/components/ui/button';
import { isFirebaseConfigured } from '@/shared/lib/firebase';
import { useNotificationsControllers } from '@/features/notifications/controllers/notificationsControllers';

import type { PushReceivedMessage } from '../types/pushTypes';
import { getPushToken, postPushToken, registerServiceWorker } from '../services/pushServices';
import { pushPrompt } from '../utils/pushPrompt';

const DISMISSED_KEY = 'masmasit:push-prompt-dismissed';

function readDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

function supportsPush(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

function browserPrompt() {
  const supported = supportsPush();
  return pushPrompt({
    configured: isFirebaseConfigured(),
    supported,
    permission: supported ? Notification.permission : 'default',
    ios: /iPad|iPhone|iPod/.test(navigator.userAgent),
    standalone: window.matchMedia('(display-mode: standalone)').matches,
    dismissed: readDismissed(),
  });
}

async function subscribe(lang: string) {
  const token = await getPushToken();
  if (!token) return { success: false, error: { message: 'Push is not supported here.' } };
  return postPushToken(token, lang);
}

function playSound() {
  try {
    const audio = new Audio('/sounds/notification.wav');
    audio.volume = 0.5;
    audio.play().catch(() => {
      // Autoplay blocked until the reader interacts; silent is fine.
    });
  } catch {
    // No Audio in this browser.
  }
}

const noSubscription = () => () => {};

/**
 * Registers the service worker, keeps the FCM token and the home-screen badge
 * in step, plays a chime for pushes that land while the app is open, and asks
 * once for permission to push to this device.
 */
export function DevicePush() {
  const { user } = useAuth();
  const { lang, t } = useLang();
  const { fetchNotifications } = useNotificationsControllers(user?.id);
  const refetchNotifications = fetchNotifications.refetch;
  const unreadCount = (fetchNotifications.data ?? []).filter((n) => !n.is_read).length;

  // Read from the browser after hydration; the server renders no prompt.
  const detected = useSyncExternalStore(noSubscription, browserPrompt, () => null);
  const [hidden, setHidden] = useState(false);
  const prompt = hidden || !user ? null : detected;

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    registerServiceWorker().catch((error) => console.error('[DevicePush]', error));
  }, []);

  // Re-saved on every visit and language switch: FCM may have rotated the
  // token, and the push copy follows the language this device last used.
  useEffect(() => {
    if (!user || !supportsPush() || Notification.permission !== 'granted') return;
    subscribe(lang).catch((error) => console.error('[DevicePush]', error));
  }, [user, lang]);

  useEffect(() => {
    if (!user || !('setAppBadge' in navigator)) return;
    const set = unreadCount > 0 ? navigator.setAppBadge(unreadCount) : navigator.clearAppBadge();
    set.catch(() => {});
  }, [user, unreadCount]);

  // The worker shows the banner; the open app adds the chime and a toast.
  useEffect(() => {
    const sw = 'serviceWorker' in navigator ? navigator.serviceWorker : null;
    if (!sw) return;
    const onMessage = (event: MessageEvent<PushReceivedMessage>) => {
      if (event.data?.type !== 'push-received') return;
      refetchNotifications();
      if (document.visibilityState !== 'visible') return;
      playSound();
      toast(event.data.title, { description: event.data.body || undefined, duration: 8000 });
    };
    sw.addEventListener('message', onMessage);
    return () => sw.removeEventListener('message', onMessage);
  }, [refetchNotifications]);

  function dismiss() {
    setHidden(true);
    try {
      localStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      // Private mode: the prompt simply comes back next visit.
    }
  }

  async function enable() {
    setHidden(true);
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;
    try {
      const result = await subscribe(lang);
      if (result.success) toast.success(t('Notifications are on for this device.', 'Notifikasi aktif di perangkat ini.'));
      else toast.error(result.error?.message ?? t('Could not turn on notifications.', 'Gagal mengaktifkan notifikasi.'));
    } catch (error) {
      console.error('[DevicePush]', error);
      toast.error(t('Could not turn on notifications.', 'Gagal mengaktifkan notifikasi.'));
    }
  }

  if (!prompt) return null;
  return (
    <div className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-md items-start gap-3 rounded-lg border bg-popover p-3 text-sm text-popover-foreground shadow-lg">
      {prompt === 'enable' ? (
        <BellRing className="mt-0.5 size-5 shrink-0 text-primary" />
      ) : (
        <Share className="mt-0.5 size-5 shrink-0 text-primary" />
      )}
      <div className="min-w-0 flex-1">
        {prompt === 'enable' ? (
          <>
            <p className="font-medium">{t('Get notified on this device', 'Dapatkan notifikasi di perangkat ini')}</p>
            <p className="text-muted-foreground">
              {t(
                'Messages, applications and status updates, even when MasmasIT is closed.',
                'Pesan, lamaran, dan pembaruan status, walau MasmasIT sedang tertutup.'
              )}
            </p>
            <Button size="sm" className="mt-2" onClick={enable}>
              {t('Turn on', 'Aktifkan')}
            </Button>
          </>
        ) : (
          <>
            <p className="font-medium">{t('Add MasmasIT to your Home Screen', 'Tambahkan MasmasIT ke Layar Utama')}</p>
            <p className="text-muted-foreground">
              {t(
                'On iPhone, notifications only arrive in the installed app. Tap Share, then Add to Home Screen.',
                'Di iPhone, notifikasi hanya masuk ke aplikasi yang terpasang. Ketuk Bagikan, lalu Tambah ke Layar Utama.'
              )}
            </p>
          </>
        )}
      </div>
      <button
        type="button"
        aria-label={t('Dismiss', 'Tutup')}
        onClick={dismiss}
        className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
