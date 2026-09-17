import { create } from 'zustand';

import type { TeamCollabs } from '../types/teamCollabsTypes';

interface TeamCollabsStore {
  teamCollabs: TeamCollabs;
}

export const useTeamCollabsStates = create<TeamCollabsStore>(() => ({
  teamCollabs: {
    status: 'loading',
    statusTitle: 'Something went wrong',
    statusSubtitle: 'Please try again later.',
    data: null,
  },
}));
