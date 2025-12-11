import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Lock, Mail } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useToast } from "@/hooks/use-toast";
import { passwordChangeSchema, emailChangeSchema } from "@/lib/validations";

const Settings = () => {
  const { user, updatePassword, updateEmail } = useAuth();
  const { profile } = useUserProfile();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: ""
  });
  
  const [emailData, setEmailData] = useState({
    newEmail: ""
  });

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
                        <p><strong>Assinatura:</strong> {profile?.subscription_status === 'premium' ? 'Premium' : 'Gratuita'}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
