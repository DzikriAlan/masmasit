import { create } from 'zustand';

import type { CaseStudies } from '../types/caseStudiesTypes';

interface CaseStudiesStore {
  caseStudies: CaseStudies;
  setCaseStudies: (caseStudies: Partial<CaseStudies>) => void;
}

export const useCaseStudiesStates = create<CaseStudiesStore>((set) => ({
  caseStudies: {
    status: 'loading',
    statusTitle: 'Something went wrong',
    statusSubtitle: 'Please try again later.',
    data: null,
  },

  setCaseStudies: (caseStudies) =>
    set((state) => ({ caseStudies: { ...state.caseStudies, ...caseStudies } })),
}));
