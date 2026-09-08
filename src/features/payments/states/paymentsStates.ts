import { create } from 'zustand';

import type { Payments } from '../types/paymentsTypes';

interface PaymentsStore {
  payments: Payments;
  setPayments: (payments: Partial<Payments>) => void;
}

export const usePaymentsStates = create<PaymentsStore>((set) => ({
  payments: {
    status: 'loading',
    statusTitle: 'Something went wrong',
    statusSubtitle: 'Please try again later.',
  },

  setPayments: (payments) => set((state) => ({ payments: { ...state.payments, ...payments } })),
}));
