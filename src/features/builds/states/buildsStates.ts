import { create } from 'zustand';

import type { Builds } from '../types/buildsTypes';

interface BuildsStore {
  builds: Builds;
}

export const useBuildsStates = create<BuildsStore>(() => ({
  builds: {
    status: 'loading',
    statusTitle: 'Something went wrong',
    statusSubtitle: 'Please try again later.',
    data: null,
  },
}));
