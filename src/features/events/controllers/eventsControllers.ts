import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { unwrapApiResponse } from '@/shared/lib/apiResponse';

import {
  getEvents,
  getEventsAttendees,
  getEventsDetail,
  getEventsMyRsvp,
  patchEventsStatus,
  updateEvents,
  getEventsRegions,
  getEventsSettings,
  postEvents,
  postEventsRsvp,
} from '../services/eventsServices';
import type { PayloadPostEvents, PayloadPostEventsRsvp, PayloadUpdateEvents } from '../types/eventsTypes';

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
    queryFn: async () => unwrapApiResponse(await getEventsSettings())?.goakal_events_url ?? null,
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

/** One event: detail, the viewer's own RSVP, and the organiser's tools. */
export const useEventsDetailControllers = (eventId: string, userId: string | undefined) => {
  const queryClient = useQueryClient();

  const invalidateEventsDetail = () => {
    queryClient.invalidateQueries({ queryKey: ['eventsDetail', eventId] });
    queryClient.invalidateQueries({ queryKey: ['events'] });
  };

  const fetchEventsDetail = useQuery({
    queryKey: ['eventsDetail', eventId],
    queryFn: async () => unwrapApiResponse(await getEventsDetail(eventId)) ?? null,
    enabled: Boolean(eventId),
  });

  const isOrganiser = Boolean(userId) && fetchEventsDetail.data?.created_by === userId;

  const fetchEventsMyRsvp = useQuery({
    queryKey: ['eventsMyRsvp', eventId, userId],
    queryFn: async () => unwrapApiResponse(await getEventsMyRsvp(eventId, userId as string)) ?? null,
    enabled: Boolean(eventId && userId),
  });

  const fetchEventsAttendees = useQuery({
    queryKey: ['eventsAttendees', eventId],
    queryFn: async () => unwrapApiResponse(await getEventsAttendees(eventId)) ?? [],
    enabled: Boolean(eventId) && isOrganiser,
  });

  const fetchEventsRegions = useQuery({
    queryKey: ['eventsRegions'],
    queryFn: async () => unwrapApiResponse(await getEventsRegions()) ?? [],
    enabled: isOrganiser,
  });

  const fetchEventsSettings = useQuery({
    queryKey: ['eventsSettings'],
    queryFn: async () => unwrapApiResponse(await getEventsSettings())?.goakal_events_url ?? null,
    enabled: Boolean(userId),
  });

  const storeEventsRsvp = useMutation({
    mutationFn: async (payload: PayloadPostEventsRsvp) =>
      unwrapApiResponse(await postEventsRsvp(payload)),
    onSuccess: () => {
      invalidateEventsDetail();
      queryClient.invalidateQueries({ queryKey: ['eventsMyRsvp', eventId] });
    },
  });

  const modifyEvents = useMutation({
    mutationFn: async (payload: PayloadUpdateEvents) => unwrapApiResponse(await updateEvents(eventId, payload)),
    onSuccess: invalidateEventsDetail,
  });

  const modifyEventsStatus = useMutation({
    mutationFn: async (status: 'active' | 'cancelled') =>
      unwrapApiResponse(await patchEventsStatus(eventId, status)),
    onSuccess: invalidateEventsDetail,
  });

  return {
    fetchEventsDetail,
    fetchEventsMyRsvp,
    fetchEventsAttendees,
    fetchEventsRegions,
    fetchEventsSettings,
    storeEventsRsvp,
    modifyEvents,
    modifyEventsStatus,
    isOrganiser,
  };
};
