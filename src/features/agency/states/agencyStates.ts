import { create } from 'zustand';

import type { Agency, AgencyDetail, AgencyManage } from '../types/agencyTypes';

interface AgencyStore {
  agency: Agency;
  agencyDetail: AgencyDetail;
  agencyManage: AgencyManage;
}

export const useAgencyStates = create<AgencyStore>(() => ({
  agency: {
    status: 'loading',
    statusTitle: 'Something went wrong',
    statusSubtitle: 'Please try again later.',
    data: null,
  },
  agencyDetail: {
    status: 'loading',
    statusTitle: 'Agency not found',
    statusSubtitle: 'It may not be approved yet, or the link is wrong.',
    data: null,
  },
  agencyManage: {
    status: 'loading',
    statusTitle: 'No agency yet',
    statusSubtitle: 'Register one to manage it here.',
    data: null,
  },
}));
