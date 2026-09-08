import { create } from 'zustand';

import type { PayloadGetSearch, Search } from '../types/searchTypes';

interface SearchStore {
  payloadGetSearch: PayloadGetSearch;
  search: Search;
  setGetSearch: (payload: Partial<PayloadGetSearch>) => void;
}

export const useSearchStates = create<SearchStore>((set) => ({
  payloadGetSearch: { query: '' },

  search: {
    status: 'loading',
    statusTitle: 'Something went wrong',
    statusSubtitle: 'Please try again later.',
    data: null,
  },

  setGetSearch: (payload) =>
    set((state) => ({ payloadGetSearch: { ...state.payloadGetSearch, ...payload } })),
}));
