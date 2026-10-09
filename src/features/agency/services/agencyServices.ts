import { supabase } from '@/shared/lib/supabase';
import { toApiResponse } from '@/shared/lib/apiResponse';
import { slugify } from '@/shared/lib/utils';

import type {
  DataAgency,
  DataAgencyDetail,
  PayloadPatchAgencyManage,
  PayloadPatchAgencyServices,
  PayloadPostAgency,
  PayloadPostAgencyServices,
} from '../types/agencyTypes';

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

// "My Agency": every agency the caller owns, any approval status (RLS
// select_agencies admits the owner), with all of its services — including
// inactive ones, which manage_own_agency_services lets the owner read.
export const getAgencyManage = async (ownerId: string) => {
  return toApiResponse<DataAgencyDetail[]>(
    supabase
      .from('agencies')
      .select('*, agency_services(*)')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: true })
      .order('created_at', { referencedTable: 'agency_services', ascending: true }),
    'Agencies retrieved successfully'
  );
};

// approval_status / is_in_house / slug are pinned by triggers for non-admins
// (migrations 015, 032), so only profile fields are sent.
export const patchAgencyManage = async (payload: PayloadPatchAgencyManage) => {
  return toApiResponse<{ id: string }>(
    supabase
      .from('agencies')
      .update({
        name: payload.name,
        description: payload.description,
        whatsapp: payload.whatsapp,
        logo_url: payload.logo_url,
      })
      .eq('id', payload.id)
      .select('id')
      .single(),
    'Agency updated successfully'
  );
};

export const postAgencyServices = async (payload: PayloadPostAgencyServices) => {
  return toApiResponse<{ id: string }>(
    supabase.from('agency_services').insert(payload).select('id').single(),
    'Service added successfully'
  );
};

export const patchAgencyServices = async ({ id, ...patch }: PayloadPatchAgencyServices) => {
  return toApiResponse<{ id: string }>(
    supabase.from('agency_services').update(patch).eq('id', id).select('id').single(),
    'Service updated successfully'
  );
};

export const deleteAgencyServices = async (id: string) => {
  return toApiResponse<{ id: string }>(
    supabase.from('agency_services').delete().eq('id', id).select('id').single(),
    'Service deleted successfully'
  );
};
