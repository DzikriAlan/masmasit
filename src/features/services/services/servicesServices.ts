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

export const postServicesRequest = async (payload: PayloadPostServicesRequest) => {
  return toApiResponse<null>(
    supabase.from('agency_projects').insert(payload),
    'Project request submitted successfully'
  );
};
