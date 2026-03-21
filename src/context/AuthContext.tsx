import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { CURRENT_USER } from '../data/mockData';

interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
  company: string;
  phone?: string;
  avatar_url?: string;
}

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, company: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Demo profile when Supabase is not configured
const DEMO_PROFILE: Profile = {
  id: 'demo',
  name: CURRENT_USER.name,
  email: CURRENT_USER.email,
  role: CURRENT_USER.role,
  company: CURRENT_USER.company,
  phone: CURRENT_USER.phone,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (data) setProfile(data as Profile);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Demo mode — pretend user is logged in
      setProfile(DEMO_PROFILE);
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) fetchProfile(s.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) fetchProfile(s.user.id);
      else setProfile(null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      setProfile(DEMO_PROFILE);
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  };

  const signUp = async (email: string, password: string, name: string, company: string) => {
    if (!isSupabaseConfigured) throw new Error('Database not configured');
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, company } },
    });
    if (error) throw new Error(error.message);
  };

  const signOut = async () => {
    if (!isSupabaseConfigured) {
      setProfile(DEMO_PROFILE); // stay in demo mode
      return;
    }
    await supabase.auth.signOut();
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!isSupabaseConfigured) {
      setProfile(prev => prev ? { ...prev, ...updates } : DEMO_PROFILE);
      return;
    }
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);
    if (error) throw new Error(error.message);
    setProfile(prev => prev ? { ...prev, ...updates } : null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      session,
      loading,
      signIn,
      signUp,
      signOut,
      updateProfile,
      isAuthenticated: isSupabaseConfigured ? !!user : true, // demo = always authenticated
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
