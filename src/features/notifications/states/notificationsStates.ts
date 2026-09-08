import { create } from 'zustand';

import type { Notifications } from '../types/notificationsTypes';

interface NotificationsStore {
  notifications: Notifications;
  setNotifications: (notifications: Partial<Notifications>) => void;
}

export const useNotificationsStates = create<NotificationsStore>((set) => ({
  notifications: {
    status: 'loading',
    statusTitle: 'Something went wrong',
    statusSubtitle: 'Please try again later.',
    data: null,
  },

  setNotifications: (notifications) =>
    set((state) => ({ notifications: { ...state.notifications, ...notifications } })),
}));
