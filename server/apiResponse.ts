import { NextResponse } from 'next/server';

/**
 * Server-side response envelope. Mirrors src/shared/lib/apiResponse.ts so the
 * shape crossing the wire is identical on both sides (see RESPONSE.md).
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

export const API_ERROR_CODE = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;

const STATUS_BY_CODE: Record<string, number> = {
  [API_ERROR_CODE.VALIDATION_ERROR]: 422,
  [API_ERROR_CODE.UNAUTHORIZED]: 401,
  [API_ERROR_CODE.FORBIDDEN]: 403,
  [API_ERROR_CODE.NOT_FOUND]: 404,
  [API_ERROR_CODE.CONFLICT]: 409,
  [API_ERROR_CODE.INTERNAL_SERVER_ERROR]: 500,
};

export const successJson = <T>(
  data: T,
  message?: string,
  options?: { status?: number; pagination?: ApiPagination }
) => {
  const body: Record<string, unknown> = { success: true, data };
  if (options?.pagination) body.pagination = options.pagination;
  if (message) body.message = message;
  return NextResponse.json(body, { status: options?.status ?? 200 });
};

export const errorJson = (
  code: string,
  message: string,
  details: Record<string, string[]> | null = null
) =>
  NextResponse.json(
    { success: false, error: { code, message, details } },
    { status: STATUS_BY_CODE[code] ?? 500 }
  );

/** Maps a PostgREST error onto the RESPONSE.md error codes. */
export const getPostgrestErrorCode = (error: { code?: string; message?: string }) => {
  if (error.code === 'PGRST116') return API_ERROR_CODE.NOT_FOUND;
  if (error.code === '23505') return API_ERROR_CODE.CONFLICT;
  if (error.code === '23514' || error.code === '22P02') return API_ERROR_CODE.VALIDATION_ERROR;
  if (error.code === '42501') return API_ERROR_CODE.FORBIDDEN;
  if (error.message?.includes('duplicate')) return API_ERROR_CODE.CONFLICT;
  return API_ERROR_CODE.INTERNAL_SERVER_ERROR;
};

/** Turns a thrown value into an envelope response. */
export const failureJson = (error: unknown) => {
  if (error && typeof error === 'object' && 'code' in error) {
    const pgError = error as { code?: string; message?: string };
    return errorJson(getPostgrestErrorCode(pgError), pgError.message ?? 'Request failed');
  }
  const message = error instanceof Error ? error.message : 'An unexpected error occurred';
  return errorJson(API_ERROR_CODE.INTERNAL_SERVER_ERROR, message);
};

/** Unwraps a Supabase result inside a route handler, throwing on error. */
export const takeData = <T>(result: { data: T | null; error: unknown }) => {
  if (result.error) throw result.error;
  return result.data;
};
