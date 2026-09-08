import { supabase } from '@/shared/lib/supabase';
import { API_ERROR_CODE, errorResponse, successResponse } from '@/shared/lib/apiResponse';

import type { DataUploads, PayloadPostUploads } from '../types/uploadsTypes';

/** Uploads to Supabase Storage and returns the public URL of the stored object. */
export const postUploads = async (payload: PayloadPostUploads) => {
  try {
    const { error } = await supabase.storage
      .from(payload.bucket)
      .upload(payload.path, payload.file, { cacheControl: '3600', upsert: true });

    if (error) return errorResponse(API_ERROR_CODE.VALIDATION_ERROR, error.message);

    const { data } = supabase.storage.from(payload.bucket).getPublicUrl(payload.path);
    return successResponse<DataUploads>({ publicUrl: data.publicUrl }, 'Upload complete');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return errorResponse(API_ERROR_CODE.INTERNAL_SERVER_ERROR, message);
  }
};
