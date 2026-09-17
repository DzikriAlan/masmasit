import { create } from 'zustand';

import type { TeamBuilder, TeamBuilderDetail } from '../types/teamBuilderTypes';

interface TeamBuilderStore {
  teamBuilder: TeamBuilder;
  teamBuilderDetail: TeamBuilderDetail;
}

export const useTeamBuilderStates = create<TeamBuilderStore>(() => ({
  teamBuilder: {
    status: 'loading',
    statusTitle: 'Something went wrong',
    statusSubtitle: 'Please try again later.',
    data: null,
  },
  teamBuilderDetail: {
    status: 'loading',
    statusTitle: 'Team not found',
    statusSubtitle: "It may not exist, or you're not on it.",
    data: null,
  },
}));
