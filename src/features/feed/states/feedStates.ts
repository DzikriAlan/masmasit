import { create } from 'zustand';

import type { Feed, PayloadGetFeed } from '../types/feedTypes';

interface FeedStore {
  payloadGetFeed: PayloadGetFeed;
  feed: Feed;
  setGetFeed: (payload: Partial<PayloadGetFeed>) => void;
}

export const useFeedStates = create<FeedStore>((set) => ({
  // The feed's whole window (its cap), paged on the client 15 at a time.
  payloadGetFeed: { limit: 200 },

  feed: {
    status: 'loading',
    statusTitle: 'Something went wrong',
    statusSubtitle: 'Please try again later.',
    data: null,
  },

  setGetFeed: (payload) => set((state) => ({ payloadGetFeed: { ...state.payloadGetFeed, ...payload } })),
}));
