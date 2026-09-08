import { create } from 'zustand';

import type { PayloadPostTalentsBooking, Talent } from '../types/talentsTypes';

interface TalentsStore {
  payloadPostTalentsBooking: PayloadPostTalentsBooking;
  talents: {
    status: string;
    statusTitle: string;
    statusSubtitle: string;
    data: Talent[] | null;
  };
  setPostTalentsBooking: (payload: Partial<PayloadPostTalentsBooking>) => void;
}

export const useTalentsStates = create<TalentsStore>((set) => ({
  payloadPostTalentsBooking: {
    talent_id: '',
    booking_type: '',
    scheduled_at: '',
    notes: null,
    amount: 0,
    admin_fee_percentage: 0,
    status: '',
    client_id: null,
  },

  talents: {
    status: 'loading',
    statusTitle: 'Something went wrong',
    statusSubtitle: 'Please try again later.',
    data: null,
  },

  setPostTalentsBooking: (payload) =>
    set((state) => ({
      payloadPostTalentsBooking: { ...state.payloadPostTalentsBooking, ...payload },
    })),
}));
