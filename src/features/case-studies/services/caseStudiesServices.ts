import { supabase } from '@/shared/lib/supabase';
import { toApiResponse } from '@/shared/lib/apiResponse';

import type { DataCaseStudies } from '../types/caseStudiesTypes';

export const getCaseStudies = async () => {
  return toApiResponse<DataCaseStudies[]>(
    supabase.from('case_studies').select('*').order('created_at', { ascending: false }),
    'Case studies retrieved successfully'
  );
};
