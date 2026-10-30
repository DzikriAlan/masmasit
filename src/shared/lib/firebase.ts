import { getApps, initializeApp } from 'firebase/app';
import { getMessaging, isSupported, type Messaging } from 'firebase/messaging';

// Web app config from Firebase console > Project settings > Your apps. These
// are public identifiers, not secrets. Push stays off until all are set.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** Cloud Messaging > Web Push certificates > Key pair (public half). */
export const firebaseVapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ?? null;

export const isFirebaseConfigured = () =>
  Boolean(firebaseVapidKey) && Object.values(firebaseConfig).every(Boolean);

/** Null when unconfigured or the browser has no Push API (Safari in a tab). */
export const getFirebaseMessaging = async (): Promise<Messaging | null> => {
  if (!isFirebaseConfigured() || !(await isSupported())) return null;
  const app = getApps()[0] ?? initializeApp(firebaseConfig);
  return getMessaging(app);
};
