import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { X, Trash2, Mail, RefreshCw, CreditCard } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-end mb-4">
            <Link to={user ? "/dashboard" : "/"} aria-label="Fechar">
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 rounded-full bg-white/90 backdrop-blur text-primary hover:bg-white shadow-sm"
              >
                <X className="h-5 w-5" />
              </Button>
            </Link>
          </div>

          <Card className="shadow-glow border-white/20 bg-white/95 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <Trash2 className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle className="text-2xl">Exclusão de Conta e Dados</CardTitle>
              <CardDescription>
                Solicite a exclusão permanente da sua conta e todos os dados associados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Subscription Warning */}
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CreditCard className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-400">
                      Importante sobre sua assinatura
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-500/90">
                      A exclusão da conta <strong>não cancela automaticamente</strong> sua assinatura e pagamentos recorrentes. 
                      Para evitar cobranças futuras, cancele sua assinatura antes de excluir a conta.
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-500/90">
                      O cancelamento é feito na loja onde você assinou:
                    </p>
                    <ul className="text-sm text-amber-700 dark:text-amber-500/90 space-y-1">
                      <li>
                        <strong>iPhone:</strong> Ajustes → seu nome (Apple ID) → Assinaturas → SoPro Neuro → Cancelar assinatura
                      </li>
                      <li>
                        <strong>Android:</strong> Google Play Store → foto do perfil → Pagamentos e assinaturas → Assinaturas → SoPro Neuro → Cancelar assinatura
                      </li>
                    </ul>
                    <p className="text-sm text-amber-700 dark:text-amber-500/90">
                      O acesso ao conteúdo continua disponível até o fim do período atual que já foi pago.
                    </p>
                    <Link to="/cancel-subscription" className="inline-flex items-center text-sm font-medium text-amber-800 dark:text-amber-400 hover:underline">
                      Ver como cancelar assinatura →
                    </Link>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">O que será excluído:</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Sua conta de usuário</li>
                  <li>Dados de perfil (nome, email)</li>
                  <li>Histórico de progresso na jornada</li>
                  <li>Respostas do onboarding</li>
                  <li>Feedback e avaliações</li>
                  <li>Dados de assinatura no app</li>
                </ul>
              </div>

              {/* If user is logged in, show direct delete button */}
              {user ? (
                <div className="border-t pt-6">
                  <Button 
                    className="w-full" 
                    variant="destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir minha conta
                  </Button>
                  <p className="text-xs text-center text-muted-foreground mt-4">
                    Esta ação é permanente e não pode ser desfeita.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Como solicitar:</h3>
                    <p className="text-muted-foreground">
                      Para solicitar a exclusão da sua conta, envie um email para nossa equipe de suporte. 
                      Processaremos sua solicitação em até 30 dias conforme a LGPD.
                    </p>
                  </div>

                  <div className="border-t pt-6">
                    <a href={mailtoLink}>
                      <Button className="w-full" variant="destructive">
                        <Mail className="w-4 h-4 mr-2" />
                        Enviar solicitação de exclusão
                      </Button>
                    </a>
                    <p className="text-xs text-center text-muted-foreground mt-4">
                      Ou envie um email diretamente para: <strong>{supportEmail}</strong>
                    </p>
                  </div>
                </>
              )}

              <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                <strong>Importante:</strong> A exclusão é permanente e não pode ser desfeita. 
                Após a exclusão, você precisará criar uma nova conta caso deseje usar o aplicativo novamente.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-md">
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
            <AlertDialogCancel disabled={isDeleteLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleteLoading}
              className="bg-destructive hover:bg-destructive/90"
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
    </div>
  );
};

export default DeleteAccount;
