/** What a browser can do about notifications, read once it has mounted. */
export interface PushEnvironment {
  /** Firebase is configured, so a token would be used. */
  configured: boolean;
  /** Service worker and Push API both exist in this browser. */
  supported: boolean;
  permission: NotificationPermission;
  /** An iPhone or iPad, where push exists only once added to the home screen. */
  ios: boolean;
  /** Opened from the home screen rather than in a browser tab. */
  standalone: boolean;
  /** The reader closed the prompt on this device already. */
  dismissed: boolean;
}

export type PushPrompt = 'enable' | 'install' | null;

/** What `public/sw.js` posts to open windows when a push lands. */
export interface PushReceivedMessage {
  type: 'push-received';
  title: string;
  body: string;
  link: string;
}
