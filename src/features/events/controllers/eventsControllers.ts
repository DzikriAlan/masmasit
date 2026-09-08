import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { unwrapApiResponse } from '@/shared/lib/apiResponse';

import {
  getEvents,
  getEventsRegions,
  getEventsSettings,
  postEvents,
  postEventsRsvp,
} from '../services/eventsServices';
import type { PayloadPostEvents, PayloadPostEventsRsvp } from '../types/eventsTypes';

export const useEventsControllers = () => {
  const queryClient = useQueryClient();

  const fetchEvents = useQuery({
    queryKey: ['events'],
    queryFn: async () => unwrapApiResponse(await getEvents()) ?? [],
  });

  const fetchEventsRegions = useQuery({
    queryKey: ['eventsRegions'],
    queryFn: async () => unwrapApiResponse(await getEventsRegions()) ?? [],
  });

  const fetchEventsSettings = useQuery({
    queryKey: ['eventsSettings'],
    queryFn: async () => unwrapApiResponse(await getEventsSettings())?.lynkid_events_url ?? null,
  });

  const storeEvents = useMutation({
    mutationFn: async (payload: PayloadPostEvents) => unwrapApiResponse(await postEvents(payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  const storeEventsRsvp = useMutation({
    mutationFn: async (payload: PayloadPostEventsRsvp) =>
      unwrapApiResponse(await postEventsRsvp(payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  return { fetchEvents, fetchEventsRegions, fetchEventsSettings, storeEvents, storeEventsRsvp };
};
