import { create } from 'zustand';

import type { PayloadPostAuthPasswordReset, Auth } from '../types/authTypes';

interface AuthStore {
  payloadPostAuthPasswordReset: PayloadPostAuthPasswordReset;
  auth: Auth;
  setPostAuthPasswordReset: (payload: Partial<PayloadPostAuthPasswordReset>) => void;
}

export const useAuthStates = create<AuthStore>((set) => ({
  payloadPostAuthPasswordReset: {
    email: '',
    redirectTo: '',
  },

  auth: {
    status: 'loading',
    statusTitle: 'Something went wrong',
    statusSubtitle: 'Please try again later.',
    data: null,
  },

  setPostAuthPasswordReset: (payload) =>
    set((state) => ({
      payloadPostAuthPasswordReset: { ...state.payloadPostAuthPasswordReset, ...payload },
    })),
}));
