import type { User } from '@supabase/supabase-js';

import { getServerSupabase } from './supabase';
import { API_ERROR_CODE, errorJson, failureJson } from './apiResponse';

export const ADMIN_ROLES = ['super_admin', 'regional_admin'] as const;

export interface AuthContext {
  user: User;
  roles: string[];
  /** Region this admin is scoped to. null for super_admin (global) . */
  regionId: string | null;
}

const getRoles = async (userId: string) => {
  const supabase = getServerSupabase();
  const { data } = await supabase.from('user_roles').select('role, region_id').eq('user_id', userId);
  return data ?? [];
};

/** Requires a signed-in caller. */
export const withAuth = async (handler: (ctx: AuthContext) => Promise<Response>) => {
  try {
    const supabase = getServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return errorJson(API_ERROR_CODE.UNAUTHORIZED, 'You must be signed in.');

    const roleRows = await getRoles(user.id);
    const regionRow = roleRows.find((r) => r.role === 'regional_admin');

    return await handler({
      user,
      roles: roleRows.map((r) => r.role),
      regionId: regionRow?.region_id ?? null,
    });
  } catch (error) {
    return failureJson(error);
  }
};

/** Allows anonymous callers; `ctx` is null when there is no session. */
export const withOptionalAuth = async (handler: (ctx: AuthContext | null) => Promise<Response>) => {
  try {
    const supabase = getServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return await handler(null);

    const roleRows = await getRoles(user.id);
    const regionRow = roleRows.find((r) => r.role === 'regional_admin');

    return await handler({
      user,
      roles: roleRows.map((r) => r.role),
      regionId: regionRow?.region_id ?? null,
    });
  } catch (error) {
    return failureJson(error);
  }
};

/** Requires super_admin or regional_admin. */
export const withAdmin = async (handler: (ctx: AuthContext) => Promise<Response>) =>
  withAuth(async (ctx) => {
    const isAdmin = ctx.roles.some((role) => (ADMIN_ROLES as readonly string[]).includes(role));
    if (!isAdmin) return errorJson(API_ERROR_CODE.FORBIDDEN, 'Admin access required.');
    return handler(ctx);
  });

/** Requires super_admin specifically — used for role grants. */
export const withSuperAdmin = async (handler: (ctx: AuthContext) => Promise<Response>) =>
  withAuth(async (ctx) => {
    if (!ctx.roles.includes('super_admin')) {
      return errorJson(API_ERROR_CODE.FORBIDDEN, 'Super admin access required.');
    }
    return handler(ctx);
  });

export const isSuperAdmin = (ctx: AuthContext) => ctx.roles.includes('super_admin');
