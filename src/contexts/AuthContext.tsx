import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔐 AuthContext - Initialisation...');
    
    // Récupérer la session actuelle
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔐 AuthContext - Session récupérée:', { 
        hasSession: !!session, 
        userId: session?.user?.id,
        userEmail: session?.user?.email 
      });
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Écouter les changements d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 AuthContext - Changement d\'auth:', { event, hasSession: !!session });
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, username: string) => {
    console.log('🔐 AuthContext - Inscription:', { email, username });
    
    try {
      // 1. Créer le compte utilisateur avec le username dans les métadonnées
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
            display_name: username
          }
        }
      });

      if (authError) {
        console.error('❌ Erreur auth signup:', authError);
        return { error: authError };
      }

      if (!authData.user) {
        console.error('❌ Pas d\'utilisateur créé');
        return { error: { message: 'Erreur lors de la création du compte' } };
      }

      console.log('✅ Utilisateur créé:', authData.user.id);
      console.log('✅ Profil créé automatiquement par le trigger avec username:', username);
      return { error: null };

    } catch (error) {
      console.error('❌ Erreur signup:', error);
      return { error: { message: 'Erreur lors de la création du compte' } };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};