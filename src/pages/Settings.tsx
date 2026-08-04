import { useState, useEffect } from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { X, Lock, Mail, Trash2, RefreshCw } from "lucide-react";
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

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-end mb-4">
            <Link to="/dashboard" aria-label="Fechar">
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
