import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AccountShell,
  AccountCard,
  accountInputClass,
  accountPrimaryButtonClass,
} from "@/components/account/AccountShell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Lock, Mail, Trash2, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useToast } from "@/hooks/use-toast";
import { passwordChangeSchema, emailChangeSchema } from "@/lib/validations";
import { supabase } from "@/integrations/supabase/client";

const Settings = () => {
  const { user, updatePassword, updateEmail, signOut } = useAuth();
  const { profile } = useUserProfile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: ""
  });
  
  const [emailData, setEmailData] = useState({
    newEmail: ""
  });

  const handleDeleteAccount = async () => {
    if (!user?.email) return;

    setIsDeleteLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-user-by-email', {
        body: { email: user.email }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Conta excluída",
          description: "Sua conta e todos os dados foram excluídos com sucesso.",
        });
        await signOut();
        navigate('/');
      } else {
        throw new Error(data?.error || "Erro ao excluir conta");
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir conta",
        variant: "destructive"
      });
    } finally {
      setIsDeleteLoading(false);
      setShowDeleteDialog(false);
    }
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = passwordChangeSchema.safeParse(passwordData);
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
    await updatePassword(passwordData.newPassword);
    setPasswordData({ newPassword: "", confirmPassword: "" });
    setIsLoading(false);
  };

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = emailChangeSchema.safeParse(emailData);
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
    await updateEmail(emailData.newEmail);
    setEmailData({ newEmail: "" });
    setIsLoading(false);
  };

  const displayName = (profile?.display_name || "").trim();
  const initial = (displayName || user.email || "?").charAt(0).toUpperCase();

  return (
    <AccountShell title="Sua conta" subtitle="Gerencie seus dados de acesso e a segurança da sua conta.">
      {/* Informações da conta */}
      <AccountCard>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[hsl(var(--electric-blue))] to-[hsl(var(--lilac))] text-lg font-bold text-primary-foreground shadow-wellness">
            {initial}
          </div>
          <div className="min-w-0">
            {displayName && (
              <p className="truncate text-base font-bold leading-tight text-foreground">{displayName}</p>
            )}
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <p className="mt-3 break-all rounded-2xl bg-muted/60 px-3 py-2 text-sm text-muted-foreground font-medium">
          ID do usuário: {user.id}
        </p>
      </AccountCard>

      {/* Alterar senha */}
      <AccountCard
        icon={<Lock className="h-5 w-5" />}
        title="Alterar senha"
        description="Mínimo 6 caracteres, com letra e número."
      >
        <form onSubmit={handlePasswordChange} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="newPassword" className="px-1 text-sm font-semibold text-muted-foreground">
              Nova senha
            </Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--lilac))]" />
              <Input
                id="newPassword"
                type="password"
                placeholder="Mínimo 6 caracteres com letra e número"
                className={accountInputClass}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="px-1 text-sm font-semibold text-muted-foreground">
              Confirmar nova senha
            </Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--lilac))]" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                className={accountInputClass}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                required
              />
            </div>
          </div>
          <button type="submit" disabled={isLoading} className={accountPrimaryButtonClass}>
            {isLoading ? "Atualizando..." : "Atualizar senha"}
          </button>
        </form>
      </AccountCard>

      {/* Alterar email */}
      <AccountCard
        icon={<Mail className="h-5 w-5" />}
        title="Alterar email"
      >
        <form onSubmit={handleEmailChange} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="currentEmail" className="px-1 text-sm font-semibold text-muted-foreground">
              Email atual
            </Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="currentEmail"
                type="email"
                value={user.email || ""}
                className={`${accountInputClass} opacity-70`}
                disabled
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="newEmail" className="px-1 text-sm font-semibold text-muted-foreground">
              Novo email
            </Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--lilac))]" />
              <Input
                id="newEmail"
                type="email"
                placeholder="novo@email.com"
                className={accountInputClass}
                value={emailData.newEmail}
                onChange={(e) => setEmailData({ newEmail: e.target.value })}
                required
              />
            </div>
          </div>
          <button type="submit" disabled={isLoading} className={accountPrimaryButtonClass}>
            {isLoading ? "Atualizando..." : "Atualizar email"}
          </button>
        </form>
      </AccountCard>

      {/* Excluir conta */}
      <AccountCard
        icon={<Trash2 className="h-5 w-5" />}
        title="Excluir conta"
        description="Todos os seus dados serão removidos para sempre. Esta ação não pode ser desfeita."
        tone="danger"
      >
        <button
          type="button"
          onClick={() => setShowDeleteDialog(true)}
          className="h-11 w-full rounded-full bg-destructive/10 text-sm font-bold text-destructive ring-1 ring-destructive/20 transition-transform active:scale-[0.98]"
        >
          Excluir minha conta
        </button>
      </AccountCard>

      {/* Delete Account Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="w-[calc(100vw-24px)] max-w-md rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-balance">
              <Trash2 className="w-5 h-5 text-destructive" />
              Excluir Conta
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir sua conta? Esta ação irá remover permanentemente:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Seus dados de perfil</li>
                <li>Histórico de progresso</li>
                <li>Dados de assinatura</li>
              </ul>
              <p className="mt-2 font-semibold">Esta ação não pode ser desfeita.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleteLoading} className="rounded-full">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleteLoading}
              className="rounded-full bg-destructive hover:bg-destructive/90"
            >
              {isDeleteLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir permanentemente"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AccountShell>
  );
};

export default Settings;
