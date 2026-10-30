import { getToken } from 'firebase/messaging';

import { supabase } from '@/shared/lib/supabase';
import { toApiResponse } from '@/shared/lib/apiResponse';
import { firebaseVapidKey, getFirebaseMessaging } from '@/shared/lib/firebase';

// The token this browser registered, so sign-out can drop it.
const TOKEN_KEY = 'masmasit:push-token';

export const registerServiceWorker = () =>
  navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' });

/** Asks FCM for this device's token through our own /sw.js registration. */
export const getPushToken = async () => {
  const messaging = await getFirebaseMessaging();
  if (!messaging || !firebaseVapidKey) return null;
  const registration = await navigator.serviceWorker.ready;
  return getToken(messaging, { vapidKey: firebaseVapidKey, serviceWorkerRegistration: registration });
};

export const postPushToken = async (token: string, lang: string) => {
  const response = await toApiResponse<null>(
    supabase.rpc('register_push_token', {
      p_token: token,
      p_lang: lang,
      p_user_agent: navigator.userAgent,
    }),
    'Push token registered successfully'
  );
  if (response.success) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // Private mode: sign-out simply leaves the token until FCM expires it.
    }
  }
  return response;
};

/** Stops pushes to this device for the signed-in account. Call before sign-out. */
export const deletePushToken = async () => {
  let token: string | null = null;
  try {
    token = localStorage.getItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    return;
  }
  if (!token) return;
  await toApiResponse<null>(
    supabase.rpc('unregister_push_token', { p_token: token }),
    'Push token removed successfully'
  );
};
