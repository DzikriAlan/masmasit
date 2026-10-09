import { supabase } from '@/shared/lib/supabase';
import { toApiResponse } from '@/shared/lib/apiResponse';

import type {
  DataEvents,
  DataEventsAttendee,
  DataEventsDetail,
  DataEventsMyRsvp,
  DataEventsRegions,
  PayloadUpdateEvents,
  PayloadPostEvents,
  PayloadPostEventsRsvp,
} from '../types/eventsTypes';

export const getEvents = async () => {
  return toApiResponse<DataEvents[]>(
    supabase
      .from('events')
      .select('*, regions(name), event_rsvps(id, user_id)')
      .order('event_date', { ascending: true }),
    'Events retrieved successfully'
  );
};

export const getEventsRegions = async () => {
  return toApiResponse<DataEventsRegions[]>(
    supabase.from('regions').select('id, name').order('name'),
    'Regions retrieved successfully'
  );
};

export const getEventsSettings = async () => {
  return toApiResponse<{ goakal_events_url: string | null }>(
    supabase.from('app_settings').select('goakal_events_url').maybeSingle(),
    'Event settings retrieved successfully'
  );
};

export const postEvents = async (payload: PayloadPostEvents) => {
  return toApiResponse<null>(supabase.from('events').insert(payload), 'Event created successfully');
};

/**
 * RSVP goes through `create_event_rsvp`, which locks the event row and checks
 * remaining capacity before inserting. The old direct insert let concurrent
 * RSVPs overshoot `max_capacity`.
 */
export const postEventsRsvp = async (payload: PayloadPostEventsRsvp) => {
  return toApiResponse<string>(
    supabase.rpc('create_event_rsvp', { p_event_id: payload.event_id }),
    'RSVP created successfully'
  );
};

export const getEventsDetail = async (id: string) => {
  return toApiResponse<DataEventsDetail>(
    supabase
      .from('events')
      .select('*, regions(name), event_rsvps(id, user_id)')
      .eq('id', id)
      .maybeSingle(),
    'Event retrieved successfully'
  );
};

export const getEventsMyRsvp = async (eventId: string, userId: string) => {
  return toApiResponse<DataEventsMyRsvp>(
    supabase
      .from('event_rsvps')
      .select('id, payment_status, payment_note')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .maybeSingle(),
    'RSVP retrieved successfully'
  );
};

/**
 * Organiser edit. approval_status is deliberately not part of the payload —
 * the 028 guard owns it. `.select('id')` turns an RLS no-op into an error.
 */
export const updateEvents = async (id: string, payload: PayloadUpdateEvents) => {
  return toApiResponse<{ id: string }>(
    supabase.from('events').update(payload).eq('id', id).select('id').single(),
    'Event updated successfully'
  );
};

/** Cancelling fires trg_notify_event_cancelled, which notifies every RSVP. */
export const patchEventsStatus = async (id: string, status: 'active' | 'cancelled') => {
  return toApiResponse<{ id: string }>(
    supabase.from('events').update({ status }).eq('id', id).select('id').single(),
    'Event status updated successfully'
  );
};

/** Organiser-only RPC: name, email and payment status of every RSVP. */
export const getEventsAttendees = async (eventId: string) => {
  return toApiResponse<DataEventsAttendee[]>(
    supabase.rpc('get_event_attendees', { p_event_id: eventId }),
    'Attendees retrieved successfully'
  );
};
