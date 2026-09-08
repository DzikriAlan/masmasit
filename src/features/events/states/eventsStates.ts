import { create } from 'zustand';

import type { PayloadPostEvents, Events } from '../types/eventsTypes';

interface EventsStore {
  payloadPostEvents: PayloadPostEvents;
  events: Events;
  setPostEvents: (payload: Partial<PayloadPostEvents>) => void;
}

export const useEventsStates = create<EventsStore>((set) => ({
  payloadPostEvents: {
    created_by: '',
    title: '',
    description: '',
    event_type: 'meetup',
    location: '',
    event_date: '',
    max_capacity: 0,
    is_paid: false,
    price: null,
    region_id: '',
  },

  events: {
    status: 'loading',
    statusTitle: 'Something went wrong',
    statusSubtitle: 'Please try again later.',
    data: null,
  },

  setPostEvents: (payload) =>
    set((state) => ({ payloadPostEvents: { ...state.payloadPostEvents, ...payload } })),
}));
