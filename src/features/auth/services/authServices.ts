import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

import { supabase } from '@/shared/lib/supabase';
import { API_ERROR_CODE, errorResponse, successResponse, toApiResponse } from '@/shared/lib/apiResponse';

import type { UserProfile } from '@/shared/lib/types';

import type {
  DataAuthProfile,
  PayloadPatchAuthPassword,
  PayloadPostAuthPasswordReset,
} from '../types/authTypes';

export const getAuthUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) return errorResponse(API_ERROR_CODE.UNAUTHORIZED, error.message);
  return successResponse(data.user, 'User retrieved successfully');
};

export const getAuthSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) return errorResponse(API_ERROR_CODE.UNAUTHORIZED, error.message);
  return successResponse(data.session, 'Session retrieved successfully');
};

export const getAuthProfile = async (userId: string) => {
  return toApiResponse<DataAuthProfile>(
    supabase.from('profiles').select('full_name, bio').eq('id', userId).maybeSingle(),
    'Profile retrieved successfully'
  );
};

export const postAuthPasswordReset = async (payload: PayloadPostAuthPasswordReset) => {
  const { error } = await supabase.auth.resetPasswordForEmail(payload.email, {
    redirectTo: payload.redirectTo,
  });
  if (error) return errorResponse(API_ERROR_CODE.VALIDATION_ERROR, error.message);
  return successResponse(null, 'Password reset email sent successfully');
};

export const updateAuthPassword = async (payload: PayloadPatchAuthPassword) => {
  const { error } = await supabase.auth.updateUser({ password: payload.password });
  if (error) return errorResponse(API_ERROR_CODE.VALIDATION_ERROR, error.message);
  return successResponse(null, 'Password updated successfully');
};

// --- Session-context data ---------------------------------------------------
// Used by AuthProvider. Session calls (`supabase.auth.*`) stay client-side by
// necessity: they read and rotate the auth cookie in the browser.

export const getAuthProfileFull = async (userId: string) => {
  return toApiResponse<UserProfile>(
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    'Profile retrieved successfully'
  );
};

export const getAuthRoles = async (userId: string) => {
  return toApiResponse<{ role: string }[]>(
    supabase.from('user_roles').select('role').eq('user_id', userId),
    'Roles retrieved successfully'
  );
};

export const postAuthSignUpProfile = async (payload: { id: string; email: string; full_name: string }) => {
  return toApiResponse<null>(supabase.from('profiles').insert(payload), 'Profile created successfully');
};

export const postAuthSignUpRole = async (userId: string) => {
  return toApiResponse<null>(
    supabase.from('user_roles').insert({ user_id: userId, role: 'member' }),
    'Default role assigned successfully'
  );
};

export const postAuthSignIn = async (email: string, password: string) => {
  return supabase.auth.signInWithPassword({ email, password });
};

export const postAuthSignUp = async (email: string, password: string, fullName: string) => {
  return supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
};

export const postAuthGoogleSignIn = async (redirectTo: string | undefined) => {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, queryParams: { prompt: 'select_account' } },
  });
};

export const postAuthSignOut = async () => supabase.auth.signOut();

export const postAuthResendVerification = async (email: string) =>
  supabase.auth.resend({ type: 'signup', email });

export const getAuthStateChange = (
  callback: (event: AuthChangeEvent, session: Session | null) => void
) => supabase.auth.onAuthStateChange(callback);
