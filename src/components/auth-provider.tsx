'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import type { UserProfile } from '@/shared/lib/types';
import { unwrapApiResponse } from '@/shared/lib/apiResponse';
import {
  getAuthProfileFull,
  getAuthRoles,
  getAuthSession,
  getAuthStateChange,
  postAuthGoogleSignIn,
  postAuthResendVerification,
  postAuthSignIn,
  postAuthSignOut,
  postAuthSignUp,
  postAuthSignUpProfile,
  postAuthSignUpRole,
} from '@/features/auth/services/authServices';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  roles: string[];
  loading: boolean;
  isEmailVerified: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  resendVerification: () => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  const loadProfile = useCallback(async (uid: string) => {
    const [profileRes, rolesRes] = await Promise.all([getAuthProfileFull(uid), getAuthRoles(uid)]);
    setProfile(profileRes.success ? (profileRes.data as UserProfile | null) : null);
    setRoles(rolesRes.success ? (rolesRes.data ?? []).map((x) => x.role) : []);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user.id);
  }, [user, loadProfile]);

  useEffect(() => {
    getAuthSession().then((res) => {
      const s = res.success ? res.data ?? null : null;
      setSession(s);
      setUser(s?.user ?? null);
      setIsEmailVerified(s?.user?.email_confirmed_at != null);
      if (s?.user) {
        loadProfile(s.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = getAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      setIsEmailVerified(s?.user?.email_confirmed_at != null);
      if (s?.user) {
        (async () => {
          await loadProfile(s.user.id);
          setLoading(false);
        })();
      } else {
        setProfile(null);
        setRoles([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const signIn = async (email: string, password: string) => {
    const { error } = await postAuthSignIn(email, password);
    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await postAuthSignUp(email, password, fullName);
    if (error) return { error: error.message };

    if (data.user) {
      await postAuthSignUpProfile({ id: data.user.id, email, full_name: fullName });
      await postAuthSignUpRole(data.user.id);
    }
    return { error: null };
  };

  const signInWithGoogle = async () => {
    // Land on the route handler that exchanges ?code for a session cookie, then
    // it forwards to the landing page. No query string, so the Supabase
    // redirect-URL allowlist needs only the plain path.
    const redirectTo =
      typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined;
    const { error } = await postAuthGoogleSignIn(redirectTo);
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await postAuthSignOut();
    setProfile(null);
    setRoles([]);
    setIsEmailVerified(false);
  };

  const resendVerification = async () => {
    if (!user) return { error: 'No user' };
    const { error } = await postAuthResendVerification(user.email!);
    return { error: error?.message ?? null };
  };

  return (
    <AuthContext.Provider
      value={{ user, session, profile, roles, loading, isEmailVerified, signIn, signUp, signInWithGoogle, signOut, refreshProfile, resendVerification }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
