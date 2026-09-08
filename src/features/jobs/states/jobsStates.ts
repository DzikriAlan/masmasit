import { create } from 'zustand';

import type { PayloadGetJobs, Jobs, JobsDetail } from '../types/jobsTypes';

interface JobsStore {
  payloadGetJobs: PayloadGetJobs;
  jobs: Jobs;
  jobsDetail: JobsDetail;
  setGetJobs: (payload: Partial<PayloadGetJobs>) => void;
}

export const useJobsStates = create<JobsStore>((set) => ({
  payloadGetJobs: {
    search: '',
    typeFilter: 'all',
    locationFilter: 'all',
  },

  jobs: {
    status: 'loading',
    statusTitle: 'Something went wrong',
    statusSubtitle: 'Please try again later.',
    data: null,
  },

  jobsDetail: {
    status: 'loading',
    statusTitle: 'Something went wrong',
    statusSubtitle: 'Please try again later.',
    data: null,
  },

  setGetJobs: (payload) => set((state) => ({ payloadGetJobs: { ...state.payloadGetJobs, ...payload } })),
}));
