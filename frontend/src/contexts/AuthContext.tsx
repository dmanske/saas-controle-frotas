import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase'; // Ajuste o caminho se necessário

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signInWithPassword: (email_param: string, password_param: string) => Promise<any>; // Adicionado parâmetros
  signUpWithPassword: (email_param: string, password_param: string, fullName_param: string) => Promise<any>; // Adicionado parâmetros
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      } catch (error) {
        console.error('Erro ao obter sessão:', error);
      } finally {
      setLoading(false);
      }
    };

    getSession();

    const { data } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
    });

    return () => {
      if (data && data.subscription) {
        data.subscription.unsubscribe();
      }
    };
  }, []);

  const signInWithPassword = async (email_param: string, password_param: string) => {
    setLoading(true);
    try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email_param,
      password: password_param,
    });
      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithPassword = async (email_param: string, password_param: string, fullName_param: string) => {
    setLoading(true);
    try {
    const { data, error } = await supabase.auth.signUp({
      email: email_param,
      password: password_param,
      options: {
        data: {
          full_name: fullName_param,
        },
      },
    });
      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
    setLoading(false);
    }
  };

  const value = {
    session,
    user,
    loading,
    signInWithPassword,
    signUpWithPassword,
    signOut,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

