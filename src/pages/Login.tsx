import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIsNativeIOS } from "@/hooks/useIsNativeIOS";
import soproLogo from "@/assets/sopro-logo.webp";
import WaveBackground from "@/components/home/WaveBackground";
import { loginSchema, signupSchema } from "@/lib/validations";
import { signInWithGoogle } from "@/lib/googleAuth";
import { signInWithApple, isAppleSignInAvailable } from "@/lib/appleAuth";


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
  const [showSignupConfirmationMsg, setShowSignupConfirmationMsg] = useState(false);
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

  // Once authenticated (and not in password recovery), let the root route decide
  // where to go (dashboard vs onboarding). Doing the routing here with extra
  // queries could leave the user stuck on a "Carregando..." screen.
  if (user && !showResetPassword) {
    return <Navigate to="/" replace />;
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
    } else {
      // Signup successful - pre-fill login email and show confirmation message
      setLoginData(prev => ({ ...prev, email: signupData.email }));
      setShowSignupConfirmationMsg(true);
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
      <AuthShell>
        <AuthHeader
          title="Redefinir senha"
          subtitle="Digite sua nova senha abaixo para continuar."
        />
        <form onSubmit={handleResetPassword} className="space-y-4 mt-6">
          <FieldPassword
            id="new-password"
            label="Nova senha"
            placeholder="Mínimo 6 caracteres"
            value={newPassword}
            onChange={setNewPassword}
            visible={showNewPassword}
            toggle={() => setShowNewPassword(!showNewPassword)}
          />
          <FieldPassword
            id="confirm-new-password"
            label="Confirmar nova senha"
            placeholder="Repita a nova senha"
            value={confirmNewPassword}
            onChange={setConfirmNewPassword}
            visible={showConfirmNewPassword}
            toggle={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
          />
          <PrimaryButton loading={isLoading} loadingLabel="Salvando...">
            Salvar nova senha
          </PrimaryButton>
        </form>
      </AuthShell>
    );
  }

  if (showForgotPassword) {
    return (
      <AuthShell>
        <button
          type="button"
          onClick={() => setShowForgotPassword(false)}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
        <AuthHeader
          title="Recuperar senha"
          subtitle="Digite seu email e enviaremos um link para redefinir sua senha."
        />
        <form onSubmit={handleForgotPassword} className="space-y-4 mt-6">
          <Field
            id="forgot-email"
            label="Email"
            type="email"
            placeholder="seu@email.com"
            icon={<Mail className="h-4 w-4" />}
            value={forgotEmail}
            onChange={setForgotEmail}
          />
          <PrimaryButton loading={isLoading} loadingLabel="Enviando...">
            Enviar link de recuperação
          </PrimaryButton>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <AuthHeader
        subtitle="Entre na sua jornada de transformação."
      />


      <Tabs defaultValue="login" className="w-full mt-6">
        <TabsList className="grid w-full grid-cols-2 mb-5 bg-[hsl(220_30%_94%)] rounded-xl p-1 h-11">
          <TabsTrigger
            value="login"
            className="rounded-lg text-sm font-semibold text-muted-foreground data-[state=active]:bg-white data-[state=active]:text-[hsl(230_85%_50%)] data-[state=active]:shadow-sm transition-all"
          >
            Entrar
          </TabsTrigger>
          <TabsTrigger
            value="register"
            className="rounded-lg text-sm font-semibold text-muted-foreground data-[state=active]:bg-white data-[state=active]:text-[hsl(230_85%_50%)] data-[state=active]:shadow-sm transition-all"
          >
            Cadastrar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="login">
          <form onSubmit={handleLogin} className="space-y-4">
            <Field
              id="email"
              label="Email"
              type="email"
              placeholder="seu@email.com"
              icon={<Mail className="h-4 w-4" />}
              value={loginData.email}
              onChange={(v) => setLoginData((p) => ({ ...p, email: v }))}
            />
            <FieldPassword
              id="password"
              label="Senha"
              placeholder="••••••"
              value={loginData.password}
              onChange={(v) => setLoginData((p) => ({ ...p, password: v }))}
              visible={showLoginPassword}
              toggle={() => setShowLoginPassword(!showLoginPassword)}
            />

            {showLoginResendLink && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendFromLogin}
                  className="text-sm text-[hsl(230_85%_50%)] hover:underline font-medium"
                >
                  Reenviar email de confirmação de cadastro
                </button>
              </div>
            )}

            {showNeedsSignup && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                <p className="text-sm text-amber-800 font-medium mb-1">
                  📧 Este email possui assinatura ativa!
                </p>
                <p className="text-xs text-amber-700">
                  Mas ainda não tem conta cadastrada. Vá para a aba{" "}
                  <span className="font-semibold">"Cadastrar"</span> para criar sua conta.
                </p>
              </div>
            )}

            <div className="text-right">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-muted-foreground hover:text-[hsl(230_85%_50%)] font-medium transition-colors"
              >
                Esqueceu a senha?
              </button>
            </div>

            <PrimaryButton loading={isLoading} loadingLabel="Entrando...">
              Entrar
            </PrimaryButton>
          </form>
          <GoogleAuthButton label="Entrar com Google" />
          <AppleAuthButton label="Continuar com Apple" />
        </TabsContent>


        <TabsContent value="register">
          <form onSubmit={handleSignup} className="space-y-4">
            <Field
              id="name"
              label="Nome completo"
              type="text"
              placeholder="Seu nome"
              icon={<User className="h-4 w-4" />}
              value={signupData.name}
              onChange={(v) => setSignupData((p) => ({ ...p, name: v }))}
            />
            <Field
              id="register-email"
              label="Email"
              type="email"
              placeholder="seu@email.com"
              icon={<Mail className="h-4 w-4" />}
              value={signupData.email}
              onChange={(v) => setSignupData((p) => ({ ...p, email: v }))}
            />
            <FieldPassword
              id="register-password"
              label="Criar senha"
              placeholder="6 caracteres com letras e números"
              value={signupData.password}
              onChange={(v) => setSignupData((p) => ({ ...p, password: v }))}
              visible={showSignupPassword}
              toggle={() => setShowSignupPassword(!showSignupPassword)}
            />
            <FieldPassword
              id="confirm-password"
              label="Repetir senha"
              placeholder="••••••"
              value={signupData.confirmPassword}
              onChange={(v) => setSignupData((p) => ({ ...p, confirmPassword: v }))}
              visible={showConfirmPassword}
              toggle={() => setShowConfirmPassword(!showConfirmPassword)}
            />

            <PrimaryButton loading={isLoading} loadingLabel="Criando conta...">
              Criar conta
            </PrimaryButton>

            {showSignupConfirmationMsg && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                <p className="text-sm text-emerald-700 font-medium">
                  📩 Após confirmar seu email, acesse sua conta em "Entrar"
                </p>
              </div>
            )}

            <div className="text-center">
              <button
                type="button"
                onClick={handleResendFromSignup}
                className="text-sm text-muted-foreground hover:text-[hsl(230_85%_50%)] font-medium"
              >
                Reenviar email de confirmação de cadastro
              </button>
            </div>

            {signupError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                <p className="text-sm text-red-600">{signupError}</p>
              </div>
            )}
          </form>
          <GoogleAuthButton label="Cadastrar com Google" />
          <AppleAuthButton label="Continuar com Apple" />
        </TabsContent>
      </Tabs>


      <div className="text-center text-xs mt-6 pt-5 border-t border-[hsl(220_30%_94%)]">
        <p className="text-muted-foreground mb-1">Ao cadastrar, você concorda com nossos</p>
        <p>
          <a
            href="https://soproneuro.com.br/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[hsl(230_85%_50%)] font-semibold hover:underline"
          >
            Termos de Uso
          </a>
          <span className="text-muted-foreground"> e </span>
          <a
            href="https://soproneuro.com.br/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[hsl(230_85%_50%)] font-semibold hover:underline"
          >
            Política de Privacidade
          </a>
        </p>
      </div>
    </AuthShell>
  );
};

/* ---------- Shared sub-components ---------- */

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 animate-page-in">
      <WaveBackground />
      <div
        className="w-full max-w-md rounded-3xl bg-white/90 backdrop-blur-md border-0 shadow-[0_24px_60px_-20px_hsl(230_60%_40%/0.28)] ring-1 ring-black/[0.04] p-6 sm:p-7"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.5rem)" }}
      >
        {children}
      </div>
    </div>
  );
}

function AuthHeader({ title, subtitle }: { title?: string; subtitle?: string }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center mb-3">
        <img src={soproLogo} alt="Sopro Neuro" className="h-11 w-auto object-contain" />
      </div>
      {title && (
        <h1 className="text-xl font-bold bg-gradient-to-r from-[hsl(220_90%_55%)] to-[hsl(258_70%_55%)] bg-clip-text text-transparent">
          {title}
        </h1>
      )}
      {subtitle && <p className="text-sm text-muted-foreground mt-1.5 leading-snug">{subtitle}</p>}
    </div>
  );
}

function Field({
  id,
  label,
  type,
  placeholder,
  icon,
  value,
  onChange,
}: {
  id: string;
  label: string;
  type: string;
  placeholder: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-semibold text-foreground/80">
        {label}
      </Label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </span>
        <Input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          className="pl-10 h-11 rounded-xl bg-white border-[hsl(220_30%_92%)] focus-visible:ring-2 focus-visible:ring-[hsl(230_85%_60%)] focus-visible:border-transparent"
        />
      </div>
    </div>
  );
}

function FieldPassword({
  id,
  label,
  placeholder,
  value,
  onChange,
  visible,
  toggle,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  visible: boolean;
  toggle: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-semibold text-foreground/80">
        {label}
      </Label>
      <div className="relative">
        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id={id}
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          className="pl-10 pr-10 h-11 rounded-xl bg-white border-[hsl(220_30%_92%)] focus-visible:ring-2 focus-visible:ring-[hsl(230_85%_60%)] focus-visible:border-transparent"
        />
        <button
          type="button"
          onClick={toggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
          aria-label={visible ? "Esconder senha" : "Mostrar senha"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function PrimaryButton({
  children,
  loading,
  loadingLabel,
}: {
  children: React.ReactNode;
  loading?: boolean;
  loadingLabel?: string;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full h-12 rounded-xl text-white font-bold text-base shadow-[0_12px_28px_-10px_hsl(230_70%_40%/0.55)] active:scale-[0.98] transition-transform disabled:opacity-60 disabled:active:scale-100"
      style={{
        background:
          "linear-gradient(135deg, hsl(220, 90%, 55%), hsl(258, 70%, 55%))",
      }}
    >
      {loading ? loadingLabel || "Carregando..." : children}
    </button>
  );
}

function GoogleAuthButton({ label }: { label: string }) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleClick = async () => {
    setLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setLoading(false);
      toast({
        title: "Erro ao entrar com Google",
        description: error.message || "Tente novamente em instantes.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="mt-5">
      <div className="flex items-center gap-3 mb-4">
        <span className="h-px flex-1 bg-[hsl(220_30%_92%)]" />
        <span className="text-xs text-muted-foreground">ou</span>
        <span className="h-px flex-1 bg-[hsl(220_30%_92%)]" />
      </div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="w-full h-12 rounded-xl border border-[hsl(220_30%_90%)] bg-white text-foreground font-semibold text-base flex items-center justify-center gap-3 active:scale-[0.98] transition-transform disabled:opacity-60"
      >
        <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
          <path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 0 1 9.77 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.94 23.94 0 0 0 0 24c0 3.88.93 7.54 2.56 10.78l7.97-6.19z" />
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.17 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        </svg>
        {loading ? "Conectando..." : label}
      </button>
    </div>
  );
}


function AppleAuthButton({ label }: { label: string }) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  if (!isAppleSignInAvailable()) return null;

  const handleClick = async () => {
    setLoading(true);
    const { error, canceled } = await signInWithApple();
    if (error || canceled) {
      setLoading(false);
      if (error) {
        toast({
          title: "Erro ao entrar com Apple",
          description: error.message || "Tente novamente em instantes.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="w-full h-12 rounded-xl border border-[hsl(220_30%_90%)] bg-foreground text-background font-semibold text-base flex items-center justify-center gap-3 active:scale-[0.98] transition-transform disabled:opacity-60"
      >
        <svg width="18" height="18" viewBox="0 0 384 512" fill="currentColor" aria-hidden="true">
          <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-36.8-2.8-77 21.3-91.7 21.3-15.6 0-51.2-20.3-79.2-20.3C61.3 141.6 12 184.2 12 271.9c0 25.9 4.7 52.7 14.2 80.3 12.6 36.3 46.7 128 91.7 126.6 23.5-.6 40.1-16.7 70.7-16.7 29.7 0 45.1 16.7 70.7 16.7 45.3-.7 76.2-83.5 88.2-119.9-60.6-28.6-58.8-107-58.8-90.2zM255.2 92.9c17.6-21.3 26.4-45.8 24.4-74.9-25.4 1.5-49 12.4-66.9 32.4-17.6 19.7-27.1 43.9-25.4 71.3 27.4 2.1 51.6-9.1 67.9-28.8z" />
        </svg>
        {loading ? "Conectando..." : label}
      </button>
    </div>
  );
}

export default Login;
