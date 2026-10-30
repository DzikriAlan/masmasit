import type { PushEnvironment, PushPrompt } from '../types/pushTypes';

/**
 * Which prompt, if any, the app shows: ask to allow notifications, tell an
 * iPhone reader to add MasmasIT to the home screen first, or nothing.
 */
export function pushPrompt(env: PushEnvironment): PushPrompt {
  if (!env.configured || env.dismissed) return null;
  if (env.supported) return env.permission === 'default' ? 'enable' : null;
  // Safari in a tab has no PushManager; the home-screen app does.
  return env.ios && !env.standalone ? 'install' : null;
}
