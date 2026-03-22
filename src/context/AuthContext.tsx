import React, { createContext, useContext, useEffect, useState } from 'react';
import { getToken, setToken, clearToken, getStoredUser, setStoredUser, API_BASE } from '../lib/supabase';

interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
  company: string;
  phone?: string;
  avatar?: string;
}

interface AuthContextValue {
  user: Profile | null;
  profile: Profile | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, company: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, restore session from localStorage
  useEffect(() => {
    const token   = getToken();
    const stored  = getStoredUser();
    if (token && stored) {
      // Use Promise.resolve().then() to defer state updates and avoid synchronous setState in effect
      Promise.resolve().then(() => {
        setUser(stored as unknown as Profile);
        setLoading(false);
      });
    } else {
      // Defer setLoading call to avoid synchronous setState in effect
      Promise.resolve().then(() => {
        setLoading(false);
      });
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('[Auth] signIn called with:', email);
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    console.log('[Auth] Response:', { ok: res.ok, hasToken: !!data.token, user: data.user });
    if (!res.ok) throw new Error(data.message || 'Login failed');
    setToken(data.token);
    setStoredUser(data.user);
    setUser(data.user as Profile);
    console.log('[Auth] User set, isAuthenticated should be true');
  };

  const signUp = async (email: string, password: string, name: string, company: string) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, company }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');
    setToken(data.token);
    setStoredUser(data.user);
    setUser(data.user as Profile);
  };

  const signOut = async () => {
    clearToken();
    setUser(null);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    const token = getToken();
    if (!token || !user) return;
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Update failed');
    const updated = { ...user, ...data };
    setUser(updated);
    setStoredUser(updated);
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile: user,
      loading,
      isAuthenticated: !!user,
      signIn,
      signUp,
      signOut,
      updateProfile,
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
