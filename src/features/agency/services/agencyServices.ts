import { supabase } from '@/shared/lib/supabase';
import { toApiResponse } from '@/shared/lib/apiResponse';
import { slugify } from '@/shared/lib/utils';

import type { DataAgency, DataAgencyDetail, PayloadPostAgency } from '../types/agencyTypes';

// REST.md Bagian 7: "/agency baru: listing semua agency approved (termasuk
// agency in-house masmasit sendiri, tidak dispesialkan)" — sorted by name
// like everything else, so the in-house row has no pinned slot.
export const getAgency = async () => {
  return toApiResponse<DataAgency[]>(
    supabase.from('agencies').select('*').eq('approval_status', 'approved').order('name'),
    'Agencies retrieved successfully'
  );
};

export const getAgencyDetail = async (slug: string) => {
  return toApiResponse<DataAgencyDetail>(
    supabase
      .from('agencies')
      .select('*, agency_services(*)')
      .eq('slug', slug)
      .eq('approval_status', 'approved')
      .single(),
    'Agency retrieved successfully'
  );
};

// Registering here (outside onboarding) also grants the agency_owner role,
// same as the onboarding sub-step — an agency should never exist without
// its owner carrying the role that explains it in Talents/Team Builder.
export const postAgency = async (payload: PayloadPostAgency) => {
  await supabase
    .from('user_roles')
    .upsert({ user_id: payload.owner_id, role: 'agency_owner' }, { onConflict: 'user_id,role', ignoreDuplicates: true });

  return toApiResponse<{ id: string; slug: string }>(
    supabase
      .from('agencies')
      .insert({
        owner_id: payload.owner_id,
        name: payload.name,
        slug: `${slugify(payload.name)}-${payload.owner_id.slice(0, 8)}`,
        logo_url: payload.logo_url || null,
        description: payload.description,
      })
      .select('id, slug')
      .single(),
    'Agency registered — pending approval'
  );
};
