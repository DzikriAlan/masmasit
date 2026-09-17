import { create } from 'zustand';

import type { Spotlight } from '../types/spotlightTypes';

interface SpotlightStore {
  spotlight: Spotlight;
}

export const useSpotlightStates = create<SpotlightStore>(() => ({
  spotlight: {
    status: 'loading',
    statusTitle: 'Something went wrong',
    statusSubtitle: 'Please try again later.',
    data: null,
  },
}));
