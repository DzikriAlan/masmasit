import { create } from 'zustand';

import type { PayloadPostMessages, Messages } from '../types/messagesTypes';

interface MessagesStore {
  payloadPostMessages: PayloadPostMessages;
  messages: Messages;
  setPostMessages: (payload: Partial<PayloadPostMessages>) => void;
}

export const useMessagesStates = create<MessagesStore>((set) => ({
  payloadPostMessages: {
    sender_id: '',
    recipient_id: '',
    body: '',
  },

  messages: {
    status: 'loading',
    statusTitle: 'Something went wrong',
    statusSubtitle: 'Please try again later.',
    data: null,
  },

  setPostMessages: (payload) =>
    set((state) => ({ payloadPostMessages: { ...state.payloadPostMessages, ...payload } })),
}));
