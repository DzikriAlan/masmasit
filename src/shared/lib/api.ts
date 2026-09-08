import type { ApiResponse } from './apiResponse';

/**
 * Client-side fetch wrapper for the routes under /api/v1.
 * Every endpoint answers with the RESPONSE.md envelope, so the parsed body is
 * returned as-is and callers unwrap it with `unwrapApiResponse`.
 */

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

const buildQueryString = (params?: Record<string, string | number | boolean | null | undefined>) => {
  if (!params) return '';
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') return;
    search.set(key, String(value));
  });
  const queryString = search.toString();
  return queryString ? `?${queryString}` : '';
};

const request = async <T>(
  path: string,
  init: RequestInit,
  params?: Record<string, string | number | boolean | null | undefined>
): Promise<ApiResponse<T>> => {
  try {
    const res = await fetch(`${baseUrl}/api/v1${path}${buildQueryString(params)}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
      credentials: 'same-origin',
    });

    // 204 carries no body; the envelope is synthesised so callers stay uniform.
    if (res.status === 204) return { success: true } as ApiResponse<T>;

    return (await res.json()) as ApiResponse<T>;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Request aborted', details: null } };
    }
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return { success: false, error: { code: 'INTERNAL_SERVER_ERROR', message, details: null } };
  }
};

export const apiGet = <T>(
  path: string,
  params?: Record<string, string | number | boolean | null | undefined>
) => request<T>(path, { method: 'GET' }, params);

export const apiPost = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) });

export const apiPatch = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'PATCH', body: body === undefined ? undefined : JSON.stringify(body) });

export const apiDelete = <T>(
  path: string,
  params?: Record<string, string | number | boolean | null | undefined>
) => request<T>(path, { method: 'DELETE' }, params);
