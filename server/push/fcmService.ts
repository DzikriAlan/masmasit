// Sends a notification row to every device its recipient allowed, through
// Firebase Cloud Messaging. Off — a silent no-op — until the three FIREBASE_*
// server variables are set.
import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

import { takeData } from '@server/apiResponse';
import { getServiceSupabase } from '@server/supabase';

/** What `public/sw.js` reads from a push. FCM data values must be strings. */
export interface PushData {
  title: string;
  body: string;
  link: string;
  /** Unread total, for the home-screen badge. */
  badge: string;
  /** Same tag replaces the earlier banner instead of stacking a new one. */
  tag: string;
  [key: string]: string;
}

// FCM's answers for a token that will never work again.
const DEAD_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
]);

interface NotificationRow {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  title_id: string | null;
  body_id: string | null;
  link: string | null;
}

const firebaseApp = (): App | null => {
  const existing = getApps()[0];
  if (existing) return existing;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // Hosts store the key on one line with literal \n.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!projectId || !clientEmail || !privateKey) return null;
  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
};

export const isPushConfigured = () => firebaseApp() !== null;

/** Push one `notifications` row to its recipient's devices. Returns how many were sent. */
export const sendNotificationPush = async (notificationId: string) => {
  const app = firebaseApp();
  if (!app) return { sent: 0, removed: 0 };

  const supabase = getServiceSupabase();
  const notification = takeData<NotificationRow>(
    await supabase
      .from('notifications')
      .select('id, user_id, title, body, title_id, body_id, link')
      .eq('id', notificationId)
      .maybeSingle()
  );
  if (!notification) return { sent: 0, removed: 0 };

  const tokens =
    takeData<{ token: string; lang: string }[]>(
      await supabase.from('push_tokens').select('token, lang').eq('user_id', notification.user_id)
    ) ?? [];
  if (tokens.length === 0) return { sent: 0, removed: 0 };

  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', notification.user_id)
    .eq('is_read', false);

  const messaging = getMessaging(app);
  const dead: string[] = [];
  let sent = 0;

  // One multicast per language, each device in the language it last used.
  for (const lang of ['en', 'id'] as const) {
    const group = tokens.filter((t) => (t.lang === 'id' ? 'id' : 'en') === lang).map((t) => t.token);
    if (group.length === 0) continue;
    const indonesian = lang === 'id';
    const data: PushData = {
      title: (indonesian && notification.title_id) || notification.title,
      body: (indonesian && notification.body_id) || notification.body || '',
      link: notification.link || '/app/dashboard',
      badge: String(count ?? 0),
      tag: notification.id,
    };
    // Data-only: the service worker draws the banner itself, so the badge,
    // link and language stay under our control.
    const result = await messaging.sendEachForMulticast({
      tokens: group,
      data,
      webpush: { headers: { Urgency: 'high', TTL: String(24 * 60 * 60) } },
    });
    sent += result.successCount;
    result.responses.forEach((response, i) => {
      if (response.success) return;
      if (DEAD_TOKEN_CODES.has(response.error?.code ?? '')) dead.push(group[i]);
      else console.error('[sendNotificationPush]', response.error?.code, response.error?.message);
    });
  }

  // Gone: the browser unsubscribed or the app was uninstalled.
  if (dead.length > 0) await supabase.from('push_tokens').delete().in('token', dead);
  return { sent, removed: dead.length };
};
