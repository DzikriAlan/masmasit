/**
 * Response envelope shared by every service and API route.
 * Shape follows RESPONSE.md: { success, data, error, pagination, message }.
 * Fields that carry no meaning for a given response are omitted, not sent as null.
 */

export interface ApiPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiError {
  code: string;
  message: string;
  details: Record<string, string[]> | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  pagination?: ApiPagination;
  message?: string;
}

export const API_ERROR_CODE = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;

export const successResponse = <T>(
  data: T,
  message?: string,
  pagination?: ApiPagination
): ApiResponse<T> => {
  const response: ApiResponse<T> = { success: true, data };
  if (pagination) response.pagination = pagination;
  if (message) response.message = message;
  return response;
};

export const errorResponse = (
  code: string,
  message: string,
  details: Record<string, string[]> | null = null
): ApiResponse<never> => ({
  success: false,
  error: { code, message, details },
});

/**
 * Maps a PostgREST error onto the RESPONSE.md error codes so callers branch on
 * `error.code` instead of parsing driver-specific message strings.
 */
const getErrorCode = (error: { code?: string; message?: string }) => {
  if (error.code === 'PGRST116') return API_ERROR_CODE.NOT_FOUND;
  if (error.code === '23505') return API_ERROR_CODE.CONFLICT;
  if (error.code === '23514' || error.code === '22P02') return API_ERROR_CODE.VALIDATION_ERROR;
  if (error.code === '42501') return API_ERROR_CODE.FORBIDDEN;
  if (error.message?.includes('duplicate')) return API_ERROR_CODE.CONFLICT;
  return API_ERROR_CODE.INTERNAL_SERVER_ERROR;
};

/**
 * Normalises a Supabase `{ data, error, count }` result into the envelope.
 * Every service returns through here so controllers never see driver shapes.
 */
export const toApiResponse = async <T>(
  query: PromiseLike<{ data: T | null; error: { code?: string; message?: string } | null; count?: number | null }>,
  message?: string
): Promise<ApiResponse<T>> => {
  try {
    const { data, error } = await query;
    if (error) return errorResponse(getErrorCode(error), error.message ?? 'Request failed');
    return successResponse((data ?? null) as T, message);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return errorResponse(API_ERROR_CODE.INTERNAL_SERVER_ERROR, 'Request aborted');
    }
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return errorResponse(API_ERROR_CODE.INTERNAL_SERVER_ERROR, message);
  }
};

/**
 * Unwraps an envelope for TanStack Query: resolves to `data`, throws on failure
 * so `isError` / `error` behave the way the rest of the query cache expects.
 */
export const unwrapApiResponse = <T>(response: ApiResponse<T>) => {
  if (!response.success) {
    const failure = new Error(response.error?.message ?? 'Request failed');
    failure.name = response.error?.code ?? API_ERROR_CODE.INTERNAL_SERVER_ERROR;
    throw failure;
  }
  return response.data as T;
};
