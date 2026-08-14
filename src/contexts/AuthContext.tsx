
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: string | null;
  fullName: string | null;
  isMember: boolean;
  isAdmin: boolean;
  isCommissionMember: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
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
  const [userRole, setUserRole] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCommissionMember, setIsCommissionMember] = useState(false);

  const fetchUserProfile = async (userId: string) => {
    try {
      // Buscar roles da tabela user_roles ao invés do campo role em profiles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      if (rolesError) {
        console.error('Erro ao buscar roles do usuário:', rolesError);
      }
      
      // Buscar is_director_member e full_name da tabela profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('is_director_member, full_name')
        .eq('user_id', userId)
        .single();
      
      if (profileError) {
        console.error('Erro ao buscar perfil do usuário:', profileError);
      }
      
      // Verificar se o usuário tem role 'member' ou 'admin'
      // Se rolesData for null, undefined ou array vazio, hasMemberRole deve ser false
      const hasMemberRole = (rolesData && rolesData.length > 0)
        ? rolesData.some(r => r.role === 'member' || r.role === 'admin')
        : false;
      const hasAdminRole = (rolesData && rolesData.length > 0)
        ? rolesData.some(r => r.role === 'admin')
        : false;
      const isCommissionMember = profileData?.is_director_member || false;
      const fullName = profileData?.full_name || null;

      return {
        isMember: hasMemberRole,
        isAdmin: hasAdminRole,
        isCommissionMember,
        fullName
      };
    } catch (error) {
      console.error('Erro inesperado ao buscar perfil:', error);
      return { isMember: false, isAdmin: false, isCommissionMember: false, fullName: null };
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session);
        
        // LIMPAR ESTADO PRIMEIRO antes de qualquer outra operação
        if (!session || event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setUserRole(null);
          setFullName(null);
          setIsMember(false);
          setIsAdmin(false);
          setIsCommissionMember(false);
          setLoading(false);
          localStorage.removeItem('supabase.auth.token');
          localStorage.removeItem('sb-bvrvhjxcqsjvrcdaffly-auth-token');
          return;
        }
        
        // Se há sessão, atualizar
        setSession(session);
        setUser(session?.user ?? null);
        
        // If email confirmation happened, automatically sign out
        if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at && !session?.user?.last_sign_in_at) {
          setTimeout(() => {
            signOut();
          }, 1000);
          return;
        }
        
        // Fetch user profile if authenticated
        if (session?.user) {
          // LIMPAR ROLES ANTES de buscar novos dados
          setIsMember(false);
          setIsAdmin(false);
          setIsCommissionMember(false);
          setUserRole(null);
          setFullName(null);

          // Sync email to profiles table
          if (session.user.email) {
            supabase
              .from('profiles')
              .update({ email: session.user.email })
              .eq('user_id', session.user.id)
              .then(({ error }) => {
                if (error) console.error('Erro ao sincronizar email no perfil:', error);
              });
          }
          
          setTimeout(() => {
            fetchUserProfile(session.user.id).then(({ isMember, isAdmin, isCommissionMember, fullName }) => {
              setIsMember(isMember);
              setIsAdmin(isAdmin);
              setIsCommissionMember(isCommissionMember);
              setUserRole(isAdmin ? 'admin' : isMember ? 'member' : null);
              setFullName(fullName);
              setLoading(false);
            });
          }, 0);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id).then(({ isMember, isAdmin, isCommissionMember, fullName }) => {
          setIsMember(isMember);
          setIsAdmin(isAdmin);
          setIsCommissionMember(isCommissionMember);
          setUserRole(isAdmin ? 'admin' : isMember ? 'member' : null);
          setFullName(fullName);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
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

  const signUp = async (email: string, password: string, fullName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName
        }
      }
    });
    return { error };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (!error) {
      supabase.functions
        .invoke('send-email', { body: { templateType: 'password_changed' } })
        .catch((err) => console.error('Erro ao enviar notificação de senha:', err));
    }

    return { error };
  };

  const signOut = async () => {
    try {
      // Clear state first to immediately hide restricted areas
      setSession(null);
      setUser(null);
      setUserRole(null);
      setFullName(null);
      setIsMember(false);
      setIsAdmin(false);
      setIsCommissionMember(false);
      
      // Clear localStorage manually
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('sb-bvrvhjxcqsjvrcdaffly-auth-token');
      
      // Then sign out from Supabase
      await supabase.auth.signOut();

      toast({
        title: "Sessão encerrada",
        description: "Você saiu da área restrita com sucesso.",
      });

      window.location.href = '/';
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      // Even if there's an error, clear the state
      setSession(null);
      setUser(null);
      setUserRole(null);
      setFullName(null);
      setIsMember(false);
      setIsAdmin(false);
      setIsCommissionMember(false);
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('sb-bvrvhjxcqsjvrcdaffly-auth-token');

      toast({
        title: "Erro",
        description: "Ocorreu um erro ao encerrar a sessão.",
        variant: "destructive"
      });

      window.location.href = '/';
    }
  };

  const value = {
    user,
    session,
    loading,
    userRole,
    fullName,
    isMember,
    isAdmin,
    isCommissionMember,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
