import { create } from 'zustand';

import type { Dashboard } from '../types/dashboardTypes';

interface DashboardStore {
  dashboard: Dashboard;
  setDashboard: (dashboard: Partial<Dashboard>) => void;
}

export const useDashboardStates = create<DashboardStore>((set) => ({
  dashboard: {
    status: 'loading',
    statusTitle: 'Something went wrong',
    statusSubtitle: 'Please try again later.',
    data: null,
  },

  setDashboard: (dashboard) => set((state) => ({ dashboard: { ...state.dashboard, ...dashboard } })),
}));
