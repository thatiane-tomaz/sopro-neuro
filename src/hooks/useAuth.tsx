import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: any; needsEmailConfirmation?: boolean; userExists?: boolean }>;
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
    let sessionChecked = false;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        
        // Handle token refresh errors by clearing stale session
        if (event === 'TOKEN_REFRESHED' && !session) {
          console.warn('Token refresh failed, clearing local auth state...');
          supabase.auth.signOut({ scope: 'local' }).catch(() => {});
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);
        
        // Only set loading to false if we've checked the session or received an event
        if (sessionChecked || event !== 'INITIAL_SESSION') {
          setLoading(false);
        }

        // Track app sessions when user signs in
        if (event === 'SIGNED_IN' && session?.user) {
          // Use setTimeout to defer non-critical operations
          setTimeout(() => {
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

            // Check subscription status after sign in (non-blocking)
            supabase.functions.invoke('check-subscription').catch(e => {
              console.error('Error checking subscription:', e);
            });
          }, 100);
        }
      }
    );

    // THEN check for existing session
    (async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!isMounted) return;
        
        if (error) {
          console.error('Error getting session:', error);
          
          // Handle stale/corrupted refresh tokens by clearing session
          const errorMsg = error.message?.toLowerCase() || '';
          if (
            errorMsg.includes('refresh_token_already_used') ||
            errorMsg.includes('invalid refresh token') ||
            errorMsg.includes('token is expired') ||
            errorMsg.includes('abuse')
          ) {
            console.warn('Stale session detected, clearing local auth state...');
            await supabase.auth.signOut({ scope: 'local' });
            setSession(null);
            setUser(null);
          }
        }
        
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        sessionChecked = true;
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
    
    // Use custom signup edge function that sends email via Resend
    const { data, error } = await supabase.functions.invoke('custom-signup', {
      body: {
        email,
        password,
        displayName,
        redirectUrl
      }
    });

    // Custom non-error response when user already exists
    if (data?.userExists) {
      const msg = data?.message || "Este email já possui uma conta cadastrada. Faça login na aba 'Entrar'.";
      toast({
        title: "Email já cadastrado",
        description: msg,
        variant: "destructive"
      });
      return { error: { message: msg }, userExists: true };
    }

    if (error || data?.error) {
      const errorMessage = data?.error || error?.message;

      // Still handle edge-function non-2xx / unexpected shapes gracefully
      const looksLikeUserExists =
        (typeof errorMessage === 'string' && (
          errorMessage.toLowerCase().includes('already been registered') ||
          errorMessage.toLowerCase().includes('already registered') ||
          errorMessage.toLowerCase().includes('email address has already')
        ));

      if (looksLikeUserExists) {
        const msg = "Este email já possui uma conta cadastrada. Faça login na aba 'Entrar'.";
        toast({
          title: "Email já cadastrado",
          description: msg,
          variant: "destructive"
        });
        return { error: { message: msg }, userExists: true };
      }

      toast({
        title: "Erro no cadastro",
        description: errorMessage,
        variant: "destructive"
      });
      return { error: { message: errorMessage } };
    }

    if (data?.needsEmailConfirmation) {
      toast({
        title: "Quase lá!",
        description: "Enviamos um email de confirmação. Verifique sua caixa de entrada."
      });
      return { error: null, needsEmailConfirmation: true };
    }

    return { error: null };
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
    const redirectUrl = `${window.location.origin}/`;
    
    // Use custom edge function to resend confirmation via Resend
    const { data, error } = await supabase.functions.invoke('resend-confirmation-email', {
      body: { email, redirectUrl }
    });

    if (error || data?.error) {
      toast({
        title: "Erro ao reenviar",
        description: data?.error || error?.message,
        variant: "destructive"
      });
      return { error: { message: data?.error || error?.message } };
    }

    toast({
      title: "Email reenviado",
      description: "Verifique sua caixa de entrada para confirmar sua conta"
    });

    return { error: null };
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