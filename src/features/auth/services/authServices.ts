import { supabase } from '@/shared/lib/supabase';

export const getCurrentUser = async () => {
  return supabase.auth.getUser();
};

export const getSession = async () => {
  return supabase.auth.getSession();
};

export const getProfileNameBio = async (userId: string) => {
  return supabase.from('profiles').select('full_name, bio').eq('id', userId).maybeSingle();
};

export const postPasswordResetEmail = async (email: string, redirectTo: string) => {
  return supabase.auth.resetPasswordForEmail(email, { redirectTo });
};

export const updateUserPassword = async (password: string) => {
  return supabase.auth.updateUser({ password });
};
