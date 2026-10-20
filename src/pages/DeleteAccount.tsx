import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, Mail, RefreshCw, CreditCard } from "lucide-react";
import { AccountShell, AccountCard } from "@/components/account/AccountShell";
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
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const DeleteAccount = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const supportEmail = "contato@soproneuro.com.br";
  const emailSubject = "Solicitação de exclusão de conta e dados";
  const emailBody = `Olá,

Gostaria de solicitar a exclusão da minha conta e de todos os meus dados pessoais do aplicativo Sopro.

Por favor, confirmem quando a exclusão for concluída.

Atenciosamente.`;

  const mailtoLink = `mailto:${supportEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

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

  return (
    <AccountShell
      title="Exclusão de conta e dados"
      subtitle="Solicite a exclusão permanente da sua conta e de todos os dados associados."
      closeTo={user ? "/dashboard" : "/"}
    >
      {/* Aviso sobre a assinatura */}
      <AccountCard
        icon={<CreditCard className="h-5 w-5" />}
        title="Importante sobre sua assinatura"
      >
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            A exclusão da conta <strong className="text-foreground">não cancela automaticamente</strong> sua assinatura e pagamentos recorrentes.
            Para evitar cobranças futuras, cancele sua assinatura antes de excluir a conta.
          </p>
          <p>O cancelamento é feito na loja onde você assinou:</p>
          <ul className="space-y-1.5 rounded-2xl bg-muted/60 p-3">
            <li>
              <strong className="text-foreground">iPhone:</strong> Ajustes → seu nome (Apple ID) → Assinaturas → SoPro Neuro → Cancelar assinatura
            </li>
            <li>
              <strong className="text-foreground">Android:</strong> Google Play Store → foto do perfil → Pagamentos e assinaturas → Assinaturas → SoPro Neuro → Cancelar assinatura
            </li>
          </ul>
          <p>O acesso ao conteúdo continua disponível até o fim do período atual que já foi pago.</p>
          <Link
            to="/cancel-subscription"
            className="inline-flex items-center text-sm font-semibold text-[hsl(var(--electric-blue))]"
          >
            Ver como cancelar assinatura →
          </Link>
        </div>
      </AccountCard>

      {/* O que será excluído */}
      <AccountCard icon={<Trash2 className="h-5 w-5" />} title="O que será excluído" tone="danger">
        <ul className="space-y-2 text-sm text-muted-foreground">
          {[
            "Sua conta de usuário",
            "Dados de perfil (nome, email)",
            "Histórico de progresso na jornada",
            "Respostas do onboarding",
            "Feedback e avaliações",
            "Dados de assinatura no app",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-destructive/60" />
              {item}
            </li>
          ))}
        </ul>

        {user ? (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowDeleteDialog(true)}
              className="flex h-12 w-full items-center justify-center rounded-full bg-destructive text-sm font-bold text-destructive-foreground transition-transform active:scale-[0.98]"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir minha conta
            </button>
            <p className="mt-3 text-center text-[13px] text-muted-foreground font-medium">
              Esta ação é permanente e não pode ser desfeita.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <h3 className="text-sm font-bold text-foreground">Como solicitar</h3>
            <p className="text-sm text-muted-foreground">
              Para solicitar a exclusão da sua conta, envie um email para nossa equipe de suporte.
              Processaremos sua solicitação em até 30 dias conforme a LGPD.
            </p>
            <a
              href={mailtoLink}
              className="flex h-12 w-full items-center justify-center rounded-full bg-destructive text-sm font-bold text-destructive-foreground transition-transform active:scale-[0.98]"
            >
              <Mail className="mr-2 h-4 w-4" />
              Enviar solicitação de exclusão
            </a>
            <p className="text-center text-[13px] text-muted-foreground font-medium">
              Ou envie um email diretamente para: <strong>{supportEmail}</strong>
            </p>
          </div>
        )}
      </AccountCard>

      <p className="rounded-3xl bg-card/60 p-4 text-sm text-muted-foreground ring-1 ring-border/40 backdrop-blur">
        <strong className="text-foreground">Importante:</strong> A exclusão é permanente e não pode ser desfeita.
        Após a exclusão, você precisará criar uma nova conta caso deseje usar o aplicativo novamente.
      </p>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="w-[calc(100vw-24px)] max-w-md rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
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
              <p className="mt-2 text-balance">
                Atenção: isso <strong>não cancela</strong> sua assinatura. Cancele na App Store (Ajustes → seu nome → Assinaturas)
                ou na Google Play Store (perfil → Pagamentos e assinaturas → Assinaturas) para parar de pagar.
              </p>
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

export default DeleteAccount;
