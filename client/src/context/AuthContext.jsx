import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient.js';
import { api } from '../services/api.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      try {
        if (isSupabaseConfigured && supabase) {
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (currentSession) {
            setSession(currentSession);
            setUser({
              id: currentSession.user.id,
              email: currentSession.user.email,
              fullName: currentSession.user.user_metadata?.full_name || currentSession.user.email,
            });
            api.setToken(currentSession.access_token);
          } else {
            api.setToken(null);
          }

          const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
            setSession(newSession);
            if (newSession) {
              setUser({
                id: newSession.user.id,
                email: newSession.user.email,
                fullName: newSession.user.user_metadata?.full_name || newSession.user.email,
              });
              api.setToken(newSession.access_token);
            } else {
              setUser(null);
              api.setToken(null);
            }
          });

          setIsLoading(false);
          return () => subscription.unsubscribe();
        } else {
          // Check for saved demo or local user
          const savedUser = localStorage.getItem('id_user');
          const savedToken = localStorage.getItem('id_token');
          if (savedUser && savedToken) {
            try {
              setUser(JSON.parse(savedUser));
              api.setToken(savedToken);
            } catch {
              localStorage.removeItem('id_user');
            }
          }
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = async (email, password) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setSession(data.session);
      setUser({
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.user_metadata?.full_name || data.user.email,
      });
      api.setToken(data.session.access_token);
      return data.user;
    } else {
      // Backend / Demo login
      const res = await api.post('/auth/login', { email, password });
      const userData = res.data.user;
      setUser(userData);
      localStorage.setItem('id_user', JSON.stringify(userData));
      api.setToken(res.data.token || 'demo-token');
      return userData;
    }
  };

  const register = async (email, password, fullName) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });
      if (error) throw error;
      if (data.session) {
        setSession(data.session);
        api.setToken(data.session.access_token);
      }
      return data.user;
    } else {
      const res = await api.post('/auth/register', { email, password, fullName });
      const userData = res.data.user;
      setUser(userData);
      localStorage.setItem('id_user', JSON.stringify(userData));
      api.setToken(res.data.token || 'demo-token');
      return userData;
    }
  };

  const loginDemo = async () => {
    const demoUser = {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'architect@intellidecision.ai',
      fullName: 'Lead Decision Architect',
      role: 'Principal Evaluator',
    };
    setUser(demoUser);
    localStorage.setItem('id_user', JSON.stringify(demoUser));
    api.setToken('demo-token');
    return demoUser;
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    localStorage.removeItem('id_user');
    api.setToken(null);
  };

  const resetPassword = async (email) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
    }
    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAuthenticated: Boolean(user),
        login,
        register,
        loginDemo,
        logout,
        resetPassword,
        isSupabaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
