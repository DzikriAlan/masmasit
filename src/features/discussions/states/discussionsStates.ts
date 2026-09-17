import { create } from 'zustand';

import type { Discussions, DiscussionsDetail } from '../types/discussionsTypes';

interface DiscussionsStore {
  discussions: Discussions;
  discussionsDetail: DiscussionsDetail;
}

export const useDiscussionsStates = create<DiscussionsStore>(() => ({
  discussions: {
    status: 'loading',
    statusTitle: 'Something went wrong',
    statusSubtitle: 'Please try again later.',
    data: null,
  },
  discussionsDetail: {
    status: 'loading',
    statusTitle: 'Discussion not found',
    statusSubtitle: 'It may have been removed.',
    data: null,
  },
}));
