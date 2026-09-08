import { create } from 'zustand';

import type { Profile } from '../types/profileTypes';

interface ProfileStore {
  profile: Profile;
  setProfile: (profile: Partial<Profile>) => void;
}

export const useProfileStates = create<ProfileStore>((set) => ({
  profile: {
    status: 'loading',
    statusTitle: 'Something went wrong',
    statusSubtitle: 'Please try again later.',
  },

  setProfile: (profile) => set((state) => ({ profile: { ...state.profile, ...profile } })),
}));
