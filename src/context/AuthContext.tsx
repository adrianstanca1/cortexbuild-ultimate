import React, { createContext, useContext, useEffect, useState } from 'react';
import { getToken, setToken, clearToken, getStoredUser, setStoredUser, API_BASE } from '../lib/auth-storage';

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
  token: string | null;
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
  const [token, setTokenState] = useState<string | null>(null);

  // On mount, restore session from localStorage
  useEffect(() => {
    const loadUser = async () => {
      const storedToken = getToken();
      const stored = getStoredUser();
      setTokenState(storedToken);

      if (storedToken && stored) {
        try {
          // Validate token with a backend call
          const res = await fetch(`${API_BASE}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          });
          if (res.ok) {
            const userData = await res.json();
            setUser(userData as Profile);
            setStoredUser(userData);
          } else {
            console.warn('Token validation failed, clearing session.', res.status);
            clearToken();
            setTokenState(null);
            setUser(null);
          }
        } catch (error) {
          console.error('Error validating token:', error);
          // Don't clear session on network error — token might still be valid
          setUser(stored as unknown as Profile | null);
        }
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const signIn = async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    setToken(data.token);
    setTokenState(data.token);
    setStoredUser(data.user);
    setUser(data.user as Profile);
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
    setTokenState(data.token);
    setStoredUser(data.user);
    setUser(data.user as Profile);
  };

  const signOut = async () => {
    const currentToken = getToken();
    // Best-effort: tell the server to blacklist this JWT
    if (currentToken) {
      try {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${currentToken}` },
        });
      } catch {
        // Network error — still clear local state
      }
    }
    clearToken();
    setTokenState(null);
    setUser(null);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    const currentToken = getToken();
    if (!currentToken || !user) return;
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${currentToken}` },
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
      token,
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
