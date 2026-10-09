import { supabase } from '@/shared/lib/supabase';
import { toApiResponse } from '@/shared/lib/apiResponse';

import type { DataServices, PayloadPostServicesRequest } from '../types/servicesTypes';

export const getServices = async () => {
  return toApiResponse<DataServices[]>(
    supabase
      .from('agency_services')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true }),
    'Services retrieved successfully'
  );
};

// client_user_id (migration 031) ties the request to the signed-in member so
// it shows under /activity?tab=requests and status notices reach them. The DB
// also forces it to auth.uid(); sending it keeps the intent explicit.
export const postServicesRequest = async (payload: PayloadPostServicesRequest) => {
  const { data: sessionData } = await supabase.auth.getSession();
  const clientUserId = sessionData.session?.user.id ?? null;
  if (!clientUserId) {
    return toApiResponse<null>(supabase.from('agency_projects').insert(payload), 'Project request submitted successfully');
  }
  const withClient = await supabase.from('agency_projects').insert({ ...payload, client_user_id: clientUserId });
  // PGRST204: column not in the schema cache yet (031 not applied) — retry
  // without it so a request is never lost to a pending migration.
  if (withClient.error?.code === 'PGRST204') {
    return toApiResponse<null>(supabase.from('agency_projects').insert(payload), 'Project request submitted successfully');
  }
  return toApiResponse<null>(Promise.resolve(withClient), 'Project request submitted successfully');
};
