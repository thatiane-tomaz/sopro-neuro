import { useState, useEffect } from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
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
import { ArrowLeft, Lock, Mail, AlertTriangle, RefreshCw, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useSubscription } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";
import { passwordChangeSchema, emailChangeSchema } from "@/lib/validations";
import { supabase } from "@/integrations/supabase/client";

const REFUND_REASONS = [
  { value: "usability", label: "Dificuldade de uso" },
  { value: "already_quit", label: "Já parei de fumar" },
  { value: "not_helpful", label: "Acho que não irá me ajudar a parar de fumar" },
] as const;

const Settings = () => {
  const { user, updatePassword, updateEmail, signOut } = useAuth();
  const { profile } = useUserProfile();
  const { isPremium, subscriptionData, checkSubscription } = useSubscription();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isRefundLoading, setIsRefundLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [refundAdditionalInfo, setRefundAdditionalInfo] = useState("");
  const [daysUntilRefundExpires, setDaysUntilRefundExpires] = useState<number | null>(null);
  
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: ""
  });
  
  const [emailData, setEmailData] = useState({
    newEmail: ""
  });

  // Calculate days until refund expires
  useEffect(() => {
    try {
      if (isPremium && subscriptionData?.started_at) {
        const paymentDate = new Date(subscriptionData.started_at);
        // Validate date
        if (isNaN(paymentDate.getTime())) {
          setDaysUntilRefundExpires(null);
          return;
        }
        const now = new Date();
        const daysSincePayment = Math.floor((now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24));
        const remaining = 7 - daysSincePayment;
        setDaysUntilRefundExpires(remaining > 0 ? remaining : null);
      } else {
        setDaysUntilRefundExpires(null);
      }
    } catch (error) {
      console.error('Error calculating refund days:', error);
      setDaysUntilRefundExpires(null);
    }
  }, [isPremium, subscriptionData]);

  const handleRefundRequest = async () => {
    if (!refundReason) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um motivo para o reembolso",
        variant: "destructive"
      });
      return;
    }

    setIsRefundLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('request-refund', {
        body: { 
          reason: REFUND_REASONS.find(r => r.value === refundReason)?.label || refundReason,
          additional_info: refundAdditionalInfo 
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Reembolso processado!",
          description: `Seu reembolso de R$ ${data.amount_refunded?.toFixed(2)} foi processado com sucesso.`,
        });
        setShowRefundDialog(false);
        setRefundReason("");
        setRefundAdditionalInfo("");
        await checkSubscription();
      } else {
        throw new Error(data?.error || "Erro ao processar reembolso");
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao solicitar reembolso",
        variant: "destructive"
      });
    } finally {
      setIsRefundLoading(false);
    }
  };

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
    
    // Validate input
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
    
    // Validate input
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


  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Link to="/dashboard" className="inline-flex items-center text-white/80 hover:text-white transition-smooth mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Link>

          <Card className="shadow-glow border-white/20 bg-white/95 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl">Configurações da Conta</CardTitle>
              <CardDescription>Gerencie suas informações pessoais e segurança</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="security" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="security">Segurança</TabsTrigger>
                  <TabsTrigger value="account">Conta</TabsTrigger>
                </TabsList>

                <TabsContent value="security">
                  <div className="space-y-6">
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      <h3 className="text-lg font-semibold">Alterar senha</h3>
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">Nova senha</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="newPassword"
                            type="password"
                            placeholder="Mínimo 6 caracteres com letra e número"
                            className="pl-10"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="••••••••"
                            className="pl-10"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            required
                          />
                        </div>
                      </div>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Atualizando..." : "Atualizar senha"}
                      </Button>
                    </form>

                    <div className="border-t pt-6">
                      <form onSubmit={handleEmailChange} className="space-y-4">
                        <h3 className="text-lg font-semibold">Alterar email</h3>
                        <div className="space-y-2">
                          <Label htmlFor="currentEmail">Email atual</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="currentEmail"
                              type="email"
                              value={user.email || ""}
                              className="pl-10 bg-muted"
                              disabled
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="newEmail">Novo email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="newEmail"
                              type="email"
                              placeholder="novo@email.com"
                              className="pl-10"
                              value={emailData.newEmail}
                              onChange={(e) => setEmailData({ newEmail: e.target.value })}
                              required
                            />
                          </div>
                        </div>
                        <Button type="submit" disabled={isLoading}>
                          {isLoading ? "Atualizando..." : "Atualizar email"}
                        </Button>
                      </form>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="account">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Informações da conta</h3>
                      <div className="space-y-2 text-sm">
                        <p><strong>Email:</strong> {user.email}</p>
                        <p><strong>ID do usuário:</strong> {user.id}</p>
                      </div>
                    </div>

                    {/* Refund Section */}
                    {isPremium && daysUntilRefundExpires !== null && (
                      <div className="border-t pt-6">
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                            <div className="flex-1">
                              <h4 className="font-semibold text-amber-900">Solicitar Reembolso</h4>
                              <p className="text-sm text-amber-700 mt-1">
                                Você tem <strong>{daysUntilRefundExpires} {daysUntilRefundExpires === 1 ? 'dia' : 'dias'}</strong> restantes para solicitar reembolso integral.
                              </p>
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-3 border-amber-300 text-amber-900 hover:bg-amber-100"
                                onClick={() => setShowRefundDialog(true)}
                              >
                                Solicitar Reembolso
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Refund Period Expired Message */}
                    {isPremium && daysUntilRefundExpires === null && subscriptionData?.started_at && (
                      <div className="border-t pt-6">
                        <div className="bg-muted/50 border border-border rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-muted-foreground mt-0.5" />
                            <div className="flex-1">
                              <h4 className="font-semibold text-muted-foreground">Período de Reembolso Expirado</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                O prazo de 7 dias para solicitar reembolso já foi ultrapassado. 
                                Se você tiver alguma dúvida ou problema, entre em contato conosco pelo email de suporte.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Delete Account Section */}
                    <div className="border-t pt-6">
                      <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <Trash2 className="w-5 h-5 text-destructive mt-0.5" />
                          <div className="flex-1">
                            <h4 className="font-semibold text-destructive">Excluir Conta</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              Ao excluir sua conta, todos os seus dados serão permanentemente removidos. Esta ação não pode ser desfeita.
                            </p>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="mt-3"
                              onClick={() => setShowDeleteDialog(true)}
                            >
                              Excluir minha conta
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Refund Dialog */}
      <AlertDialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Solicitar Reembolso
            </AlertDialogTitle>
            <AlertDialogDescription>
              Ao solicitar o reembolso, você perderá o acesso ao conteúdo premium imediatamente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <Label>Por que você está solicitando o reembolso?</Label>
              <RadioGroup value={refundReason} onValueChange={setRefundReason}>
                {REFUND_REASONS.map((reason) => (
                  <div key={reason.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={reason.value} id={reason.value} />
                    <Label htmlFor={reason.value} className="font-normal cursor-pointer">
                      {reason.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalInfo">
                Informações adicionais <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <Textarea
                id="additionalInfo"
                placeholder="Conte-nos mais sobre sua experiência para nos ajudar a melhorar..."
                value={refundAdditionalInfo}
                onChange={(e) => setRefundAdditionalInfo(e.target.value)}
                className="resize-none"
                rows={3}
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRefundLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRefundRequest}
              disabled={isRefundLoading || !refundReason}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isRefundLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                "Confirmar Reembolso"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account Dialog */}
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

export default Settings;
