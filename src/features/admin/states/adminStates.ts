import { create } from 'zustand';

import type { Admin } from '../types/adminTypes';

interface AdminStore {
  admin: Admin;
  setAdmin: (admin: Partial<Admin>) => void;
}

export const useAdminStates = create<AdminStore>((set) => ({
  admin: {
    status: 'loading',
    statusTitle: 'Something went wrong',
    statusSubtitle: 'Please try again later.',
    data: null,
  },

  setAdmin: (admin) => set((state) => ({ admin: { ...state.admin, ...admin } })),
}));
