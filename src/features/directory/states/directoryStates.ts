import { create } from 'zustand';

import type { PayloadGetDirectory, Directory, DirectoryDetail } from '../types/directoryTypes';

interface DirectoryStore {
  payloadGetDirectory: PayloadGetDirectory;
  directory: Directory;
  directoryDetail: DirectoryDetail;
  setGetDirectory: (payload: Partial<PayloadGetDirectory>) => void;
}

export const useDirectoryStates = create<DirectoryStore>((set) => ({
  payloadGetDirectory: {
    search: '',
    locationFilter: 'all',
    statusFilter: 'all',
    skillFilter: 'all',
    page: 1,
  },

  directory: {
    status: 'loading',
    statusTitle: 'Something went wrong',
    statusSubtitle: 'Please try again later.',
    data: null,
  },

  directoryDetail: {
    status: 'loading',
    statusTitle: 'Something went wrong',
    statusSubtitle: 'Please try again later.',
    data: null,
  },

  setGetDirectory: (payload) =>
    set((state) => ({ payloadGetDirectory: { ...state.payloadGetDirectory, ...payload } })),
}));
