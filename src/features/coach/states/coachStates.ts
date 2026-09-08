import { create } from 'zustand';

import type { PayloadPostCoachCourses, Coach } from '../types/coachTypes';

interface CoachStore {
  payloadPostCoachCourses: PayloadPostCoachCourses;
  coach: Coach;
  setPostCoachCourses: (payload: Partial<PayloadPostCoachCourses>) => void;
}

export const useCoachStates = create<CoachStore>((set) => ({
  payloadPostCoachCourses: {
    coach_id: '',
    title: '',
    description: '',
    level: 'beginner',
    category: null,
    price: 0,
  },

  coach: {
    status: 'loading',
    statusTitle: 'Something went wrong',
    statusSubtitle: 'Please try again later.',
    data: null,
  },

  setPostCoachCourses: (payload) =>
    set((state) => ({ payloadPostCoachCourses: { ...state.payloadPostCoachCourses, ...payload } })),
}));
