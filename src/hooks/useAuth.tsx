import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
  updateEmail: (newEmail: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Track app sessions when user signs in
        if (event === 'SIGNED_IN' && session?.user) {
          // Use requestAnimationFrame to defer non-critical operations
          requestAnimationFrame(() => {
            if (!isMounted) return;
            
            // Track app session - wrapped in async IIFE for proper error handling
            (async () => {
              try {
                const { error } = await supabase
                  .from('app_sessions')
                  .insert({ user_id: session.user.id });
                if (error) console.error('Error tracking app session:', error);
              } catch (e) {
                console.error('Error tracking app session:', e);
              }
            })();

            // Check subscription status after sign in
            (async () => {
              try {
                await supabase.functions.invoke('check-subscription');
              } catch (e) {
                console.error('Error checking subscription:', e);
              }
            })();
          });
        }
      }
    );

    // THEN check for existing session
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, displayName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName
        }
      }
    });

    if (error) {
      // Handle specific error for user already exists
      if (error.message.includes('already registered') || error.message.includes('User already registered')) {
        toast({
          title: "Email já cadastrado",
          description: "Este email já possui uma conta. Por favor, faça login.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Erro no cadastro",
          description: error.message,
          variant: "destructive"
        });
      }
    } else if (data.user && !data.session) {
      // User exists but email not confirmed (Supabase returns user without session in this case)
      toast({
        title: "Email já cadastrado",
        description: "Este email já possui uma conta. Por favor, faça login ou verifique seu email.",
        variant: "destructive"
      });
      return { error: new Error("User already exists") };
    } else {
      toast({
        title: "Cadastro realizado",
        description: "Verifique seu email para confirmar a conta"
      });
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      toast({
        title: "Erro no login",
        description: error.message,
        variant: "destructive"
      });
    }

    return { error };
  };


  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      toast({
        title: "Erro ao atualizar senha",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Senha atualizada",
        description: "Sua senha foi alterada com sucesso"
      });
    }

    return { error };
  };

  const updateEmail = async (newEmail: string) => {
    const { error } = await supabase.auth.updateUser({
      email: newEmail
    });

    if (error) {
      toast({
        title: "Erro ao atualizar email",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Email atualizado",
        description: "Verifique seu novo email para confirmar a mudança"
      });
    }

    return { error };
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signUp,
      signIn,
      signOut,
      updatePassword,
      updateEmail
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};