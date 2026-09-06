'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/shared/lib/supabase';
import type { UserProfile } from '@/shared/lib/types';

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
    const { data: p } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle();
    setProfile(p as UserProfile | null);

    const { data: r } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', uid);
    setRoles(r ? r.map((x: { role: string }) => x.role) : []);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user.id);
  }, [user, loadProfile]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setIsEmailVerified(s?.user?.email_confirmed_at != null);
      if (s?.user) {
        loadProfile(s.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) return { error: error.message };

    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        email,
        full_name: fullName,
      });
      await supabase.from('user_roles').insert({
        user_id: data.user.id,
        role: 'member',
      });
    }
    return { error: null };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Land on the route handler that exchanges ?code for a session cookie,
        // then it forwards to the landing page (logged-in view).
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback?next=/` : undefined,
        queryParams: { prompt: 'select_account' },
      },
    });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setRoles([]);
    setIsEmailVerified(false);
  };

  const resendVerification = async () => {
    if (!user) return { error: 'No user' };
    const { error } = await supabase.auth.resend({ type: 'signup', email: user.email! });
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
