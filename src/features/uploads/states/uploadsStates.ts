import { create } from 'zustand';

import type { Uploads } from '../types/uploadsTypes';

interface UploadsStore {
  uploads: Uploads;
  setUploads: (uploads: Partial<Uploads>) => void;
}

export const useUploadsStates = create<UploadsStore>((set) => ({
  uploads: {
    status: 'loading',
    statusTitle: 'Something went wrong',
    statusSubtitle: 'Please try again later.',
    data: null,
  },

  setUploads: (uploads) => set((state) => ({ uploads: { ...state.uploads, ...uploads } })),
}));
