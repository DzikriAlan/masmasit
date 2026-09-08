import { create } from 'zustand';

import type { Onboarding } from '../types/onboardingTypes';

interface OnboardingStore {
  onboarding: Onboarding;
  setOnboarding: (onboarding: Partial<Onboarding>) => void;
}

export const useOnboardingStates = create<OnboardingStore>((set) => ({
  onboarding: {
    status: 'loading',
    statusTitle: 'Something went wrong',
    statusSubtitle: 'Please try again later.',
  },

  setOnboarding: (onboarding) =>
    set((state) => ({ onboarding: { ...state.onboarding, ...onboarding } })),
}));
