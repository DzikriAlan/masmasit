import { create } from 'zustand';

import type { PayloadPostServicesRequest, Services } from '../types/servicesTypes';

interface ServicesStore {
  payloadPostServicesRequest: PayloadPostServicesRequest;
  services: Services;
  setPostServicesRequest: (payload: Partial<PayloadPostServicesRequest>) => void;
}

export const useServicesStates = create<ServicesStore>((set) => ({
  payloadPostServicesRequest: {
    client_name: '',
    client_email: '',
    client_company: null,
    service_id: null,
    scope: '',
    budget: null,
  },

  services: {
    status: 'loading',
    statusTitle: 'Something went wrong',
    statusSubtitle: 'Please try again later.',
    data: null,
  },

  setPostServicesRequest: (payload) =>
    set((state) => ({
      payloadPostServicesRequest: { ...state.payloadPostServicesRequest, ...payload },
    })),
}));
