import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: any; needsEmailConfirmation?: boolean; userExists?: boolean; noSubscription?: boolean; subscriptionExpired?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: any; needsEmailConfirmation?: boolean; needsSignup?: boolean }>;
  signOut: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
  updateEmail: (newEmail: string) => Promise<{ error: any }>;
  resendConfirmationEmail: (email: string) => Promise<{ error: any }>;
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
    
    // First, check if this email has an active subscription
    const { data: subData, error: subError } = await supabase.functions.invoke('check-subscription', {
      body: { email }
    });

    if (subError) {
      console.error('Error checking subscription:', subError);
      toast({
        title: "Erro ao verificar assinatura",
        description: "Tente novamente mais tarde",
        variant: "destructive"
      });
      return { error: subError };
    }

    // Check subscription status
    if (!subData?.has_subscription) {
      toast({
        title: "Assinatura não encontrada",
        description: "Este email não possui uma assinatura ativa. Adquira o programa primeiro.",
        variant: "destructive"
      });
      return { error: { message: "Assinatura não encontrada para este email" }, noSubscription: true };
    }

    if (!subData?.subscribed) {
      toast({
        title: "Assinatura expirada",
        description: "Sua assinatura expirou. Adquira novamente para continuar.",
        variant: "destructive"
      });
      return { error: { message: "Assinatura expirada" }, subscriptionExpired: true };
    }

    // Check if this email already has a user account linked
    if (subData?.has_account) {
      toast({
        title: "Conta já existe",
        description: "Este email já possui uma conta cadastrada. Faça login.",
        variant: "destructive"
      });
      return { error: { message: "Conta já cadastrada" }, userExists: true };
    }

    // Proceed with signup
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
          description: "Este email já possui uma conta. Faça login ou reenvie a confirmação.",
          variant: "destructive"
        });
        return { error, userExists: true };
      } else {
        toast({
          title: "Erro no cadastro",
          description: error.message,
          variant: "destructive"
        });
      }
    } else if (data.user && !data.session) {
      // User created but needs email confirmation
      toast({
        title: "Quase lá!",
        description: "Enviamos um email de confirmação. Verifique sua caixa de entrada."
      });
      return { error: null, needsEmailConfirmation: true };
    } else if (data.session) {
      // User created and confirmed (auto-confirm is enabled)
      toast({
        title: "Cadastro realizado",
        description: "Bem-vindo!"
      });
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    // First try to sign in
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      // Check for invalid credentials - might be because account doesn't exist
      if (error.message.includes('Invalid login credentials')) {
        // Check if this email has a subscription but no account
        const { data: subData } = await supabase.functions.invoke('check-subscription', {
          body: { email }
        });

        if (subData?.has_subscription && !subData?.has_account) {
          toast({
            title: "Conta não encontrada",
            description: "Este email possui uma assinatura ativa, mas ainda não tem cadastro. Vá para a aba 'Cadastrar' para criar sua conta.",
            variant: "destructive"
          });
          return { error, needsSignup: true };
        }

        toast({
          title: "Erro no login",
          description: "Email ou senha incorretos. Verifique seus dados e tente novamente.",
          variant: "destructive"
        });
      } else if (error.message.includes('Email not confirmed') || error.message.includes('email not confirmed')) {
        toast({
          title: "Email não confirmado",
          description: "Verifique sua caixa de entrada e confirme seu email para fazer login.",
          variant: "destructive"
        });
        return { error, needsEmailConfirmation: true };
      } else {
        toast({
          title: "Erro no login",
          description: error.message,
          variant: "destructive"
        });
      }
    }

    return { error };
  };

  const resendConfirmationEmail = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${window.location.origin}/`
      }
    });

    if (error) {
      toast({
        title: "Erro ao reenviar",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Email reenviado",
        description: "Verifique sua caixa de entrada para confirmar sua conta"
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
      updateEmail,
      resendConfirmationEmail
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