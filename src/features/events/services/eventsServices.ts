import { supabase } from '@/shared/lib/supabase';
import { toApiResponse } from '@/shared/lib/apiResponse';

import type {
  DataEvents,
  DataEventsRegions,
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
  return toApiResponse<{ lynkid_events_url: string | null }>(
    supabase.from('app_settings').select('lynkid_events_url').maybeSingle(),
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
