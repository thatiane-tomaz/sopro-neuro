import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIsNativeIOS } from "@/hooks/useIsNativeIOS";
import soproLogo from "@/assets/sopro-logo.png";
import { loginSchema, signupSchema } from "@/lib/validations";

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [signupError, setSignupError] = useState<string | null>(null);
  const [showNeedsSignup, setShowNeedsSignup] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showLoginResendLink, setShowLoginResendLink] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const { user, signIn, signUp, signOut, resendConfirmationEmail, updatePassword } = useAuth();
  const { toast } = useToast();
  const isNativeIOS = useIsNativeIOS();

  // Detect and handle password recovery flow
  useEffect(() => {
    const hash = window.location.hash ?? "";
    const search = window.location.search ?? "";

    // When coming from the recovery email link, Supabase typically appends `type=recovery`
    // We also support a custom query param to avoid mobile/in-app-browser hash issues.
    if (
      hash.includes("type=recovery") ||
      search.includes("type=recovery") ||
      search.includes("mode=recovery")
    ) {
      setShowResetPassword(true);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setShowResetPassword(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check if user has completed onboarding
  useEffect(() => {
    let isMounted = true;
    let navigationTimeout: ReturnType<typeof setTimeout> | null = null;
    
    const checkOnboarding = async () => {
      // During password recovery we must NOT redirect; user needs to stay here and set a new password.
      if (!user || showResetPassword) return;

      try {
        // First check if user profile exists (user might have been deleted from DB but session still active)
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!isMounted) return;

        // If no profile found, user was likely deleted - sign out
        if (!profileData || profileError) {
          console.log('User profile not found, signing out...');
          await signOut();
          return;
        }

        const { data: onboardingData, error } = await supabase
          .from('onboarding_responses')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!isMounted) return;

        if (error) {
          console.error('Error checking onboarding:', error);
          return;
        }

        // Use timeout to avoid race conditions
        navigationTimeout = setTimeout(() => {
          if (!isMounted) return;
          if (onboardingData) {
            // User completed onboarding, go to dashboard
            window.location.href = "/dashboard";
          } else {
            // User needs to complete onboarding
            window.location.href = "/onboarding";
          }
        }, 100);
      } catch (error) {
        console.error('Error in checkOnboarding:', error);
      }
    };

    checkOnboarding();

    return () => {
      isMounted = false;
      if (navigationTimeout) clearTimeout(navigationTimeout);
    };
  }, [user, showResetPassword]);

  // Don't redirect if showing reset password form
  if (user && !showResetPassword) {
    return <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
      <div className="text-gray-700">Carregando...</div>
    </div>;
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmNewPassword) {
      toast({
        title: "Senhas não conferem",
        description: "A nova senha e a confirmação devem ser iguais",
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    const { error } = await updatePassword(newPassword);
    
    if (!error) {
      setShowResetPassword(false);
      setNewPassword("");
      setConfirmNewPassword("");
      // Redirect to dashboard after successful password reset
      window.location.href = "/dashboard";
    }
    
    setIsLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    const validation = loginSchema.safeParse(loginData);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast({
        title: "Erro de validação",
        description: firstError.message,
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    const result = await signIn(loginData.email, loginData.password);
    
    if (result.needsEmailConfirmation) {
      setShowLoginResendLink(true);
    }
    
    if (result.needsSignup) {
      setShowNeedsSignup(true);
      // Pre-fill the email in signup form
      setSignupData(prev => ({ ...prev, email: loginData.email }));
    }
    
    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);
    
    // Validate input
    const validation = signupSchema.safeParse(signupData);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      setSignupError(firstError.message);
      toast({
        title: "Erro de validação",
        description: firstError.message,
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    const result = await signUp(signupData.email, signupData.password, signupData.name);
    
    if (result.error) {
      if (result.userExists) {
        setSignupError("Este email já possui cadastro. Vá para a aba 'Entrar' para acessar sua conta.");
      } else {
        setSignupError(result.error.message);
      }
    }
    
    setIsLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!forgotEmail.trim()) {
      toast({
        title: "Email necessário",
        description: "Por favor, informe seu email",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    // Use the published app URL for password reset redirect (hardcoded to avoid issues with native apps)
    const appUrl = 'https://sopro-neuro.lovable.app';
    
    // Use custom edge function to send password reset email via Resend
    const { data, error } = await supabase.functions.invoke('custom-password-reset', {
      body: { 
        email: forgotEmail, 
        redirectUrl: `${appUrl}/login?mode=recovery`
      }
    });
    
    if (error || data?.error) {
      toast({
        title: "Erro",
        description: data?.error || error?.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Email enviado",
        description: "Verifique sua caixa de entrada para redefinir sua senha"
      });
      setShowForgotPassword(false);
      setForgotEmail("");
    }
    
    setIsLoading(false);
  };

  const handleResendFromLogin = async () => {
    if (!loginData.email.trim()) {
      toast({
        title: "Email necessário",
        description: "Por favor, preencha o campo de email",
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);
    await resendConfirmationEmail(loginData.email);
    setIsLoading(false);
  };

  const handleResendFromSignup = async () => {
    if (!signupData.email.trim()) {
      toast({
        title: "Email necessário",
        description: "Por favor, preencha o campo de email",
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);
    await resendConfirmationEmail(signupData.email);
    setIsLoading(false);
  };

  // Show reset password form when user clicks the recovery link
  if (showResetPassword) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <img src={soproLogo} alt="Sopro" className="h-12 w-auto object-contain" />
            </div>
            <p className="text-slate-500 text-lg font-medium">Redefinir senha</p>
            <p className="text-slate-400 text-sm mt-2">
              Digite sua nova senha abaixo
            </p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-slate-500">Nova senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input 
                  id="new-password" 
                  type={showNewPassword ? "text" : "password"} 
                  placeholder="Mínimo 6 caracteres" 
                  className="pl-10 pr-10"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required 
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-new-password" className="text-slate-500">Confirmar nova senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input 
                  id="confirm-new-password" 
                  type={showConfirmNewPassword ? "text" : "password"} 
                  placeholder="Repita a nova senha" 
                  className="pl-10 pr-10"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required 
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full bg-white text-primary hover:bg-white/90 shadow-lg font-semibold" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar nova senha"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <img src={soproLogo} alt="Sopro" className="h-12 w-auto object-contain" />
            </div>
            <p className="text-slate-500 text-lg font-medium">Recuperar senha</p>
            <p className="text-slate-400 text-sm mt-2">
              Digite seu email e enviaremos um link para redefinir sua senha
            </p>
          </div>

          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email" className="text-slate-500">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input 
                  id="forgot-email" 
                  type="email" 
                  placeholder="seu@email.com" 
                  className="pl-10"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required 
                />
              </div>
            </div>
            <Button type="submit" className="w-full bg-white text-primary hover:bg-white/90 shadow-lg font-semibold" disabled={isLoading}>
              {isLoading ? "Enviando..." : "Enviar link de recuperação"}
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              className="w-full text-slate-500 hover:text-slate-600 hover:bg-white/10" 
              onClick={() => setShowForgotPassword(false)}
            >
              Voltar ao login
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <img src={soproLogo} alt="Sopro" className="h-12 w-auto object-contain" />
          </div>
          <p className="text-slate-500">Entre na sua jornada de transformação</p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-white/20 border-0">
            <TabsTrigger value="login" className="text-slate-500 data-[state=active]:bg-white data-[state=active]:text-primary">Entrar</TabsTrigger>
            <TabsTrigger value="register" className="text-slate-500 data-[state=active]:bg-white data-[state=active]:text-primary">Cadastrar</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-500">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="seu@email.com" 
                    className="pl-10"
                    value={loginData.email}
                    onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-500">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input 
                    id="password" 
                    type={showLoginPassword ? "text" : "password"} 
                    placeholder="••••••" 
                    className="pl-10 pr-10"
                    value={loginData.password}
                    onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                    required 
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {showLoginResendLink && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendFromLogin}
                    className="text-sm text-slate-500 hover:text-slate-600 hover:underline"
                  >
                    Reenviar email de confirmação de cadastro
                  </button>
                </div>
              )}
              {showNeedsSignup && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                  <p className="text-sm text-amber-800 font-medium mb-1">
                    📧 Este email possui assinatura ativa!
                  </p>
                  <p className="text-xs text-amber-700">
                    Mas ainda não tem conta cadastrada. Vá para a aba{' '}
                    <span className="font-semibold">"Cadastrar"</span> para criar sua conta.
                  </p>
                </div>
              )}
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-slate-500 hover:text-slate-600 hover:underline"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <Button type="submit" className="w-full bg-white text-primary hover:bg-white/90 shadow-lg font-semibold" disabled={isLoading}>
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="register">
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-500">Nome completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input 
                    id="name" 
                    type="text" 
                    placeholder="Seu nome" 
                    className="pl-10"
                    value={signupData.name}
                    onChange={(e) => setSignupData(prev => ({ ...prev, name: e.target.value }))}
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-email" className="text-slate-500">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input 
                    id="register-email" 
                    type="email" 
                    placeholder="seu@email.com" 
                    className="pl-10"
                    value={signupData.email}
                    onChange={(e) => setSignupData(prev => ({ ...prev, email: e.target.value }))}
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password" className="text-slate-500">Criar Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input 
                    id="register-password" 
                    type={showSignupPassword ? "text" : "password"} 
                    placeholder="6 caracteres com letras e números" 
                    className="pl-10 pr-10"
                    value={signupData.password}
                    onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
                    required 
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-slate-500">Repetir Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input 
                    id="confirm-password" 
                    type={showConfirmPassword ? "text" : "password"} 
                    placeholder="••••••" 
                    className="pl-10 pr-10"
                    value={signupData.confirmPassword}
                    onChange={(e) => setSignupData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required 
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full bg-white text-primary hover:bg-white/90 shadow-lg font-semibold" disabled={isLoading}>
                {isLoading ? "Criando conta..." : "Criar conta"}
              </Button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendFromSignup}
                  className="text-sm text-slate-500 hover:text-slate-600 hover:underline"
                >
                  Reenviar email de confirmação de cadastro
                </button>
              </div>

              {/* Error message with help link */}
              {signupError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                  <p className="text-sm text-red-600 mb-1">{signupError}</p>
                  <p className="text-xs text-slate-600">
                    Verifique se está utilizando o mesmo email do pagamento.
                    {!isNativeIOS && (
                      <>
                        {' '}
                        <a 
                          href="https://soproneuro.com.br/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary font-semibold hover:underline"
                        >
                          Ainda não adquiriu? Clique aqui.
                        </a>
                      </>
                    )}
                  </p>
                </div>
              )}

              {/* Link for users who haven't paid yet - hidden on iOS */}
              {!isNativeIOS && (
                <div className="text-center pt-2 border-t border-slate-200">
                  <p className="text-xs text-slate-500">
                    Ainda não adquiriu o programa?{' '}
                    <a 
                      href="https://soproneuro.com.br/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary font-semibold hover:underline"
                    >
                      Clique aqui
                    </a>
                  </p>
                </div>
              )}
            </form>
          </TabsContent>
        </Tabs>

        <div className="text-center text-sm">
          <p className="text-slate-400 font-medium mb-1">Ao cadastrar, você concorda com nossos</p>
          <p>
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-slate-500 font-semibold hover:underline">
              Termos de Uso
            </a>
            {" e "}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-slate-500 font-semibold hover:underline">
              Política de Privacidade
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;