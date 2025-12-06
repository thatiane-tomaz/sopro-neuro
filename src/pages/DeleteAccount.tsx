import { Link } from "react-router-dom";
import { ArrowLeft, Trash2, Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const DeleteAccount = () => {
  const supportEmail = "contato@soproneuro.com.br";
  const emailSubject = "Solicitação de exclusão de conta e dados";
  const emailBody = `Olá,

Gostaria de solicitar a exclusão da minha conta e de todos os meus dados pessoais do aplicativo Sopro.

Por favor, confirmem quando a exclusão for concluída.

Atenciosamente.`;

  const mailtoLink = `mailto:${supportEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Link to="/" className="inline-flex items-center text-white/80 hover:text-white transition-smooth mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Link>

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
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">O que será excluído:</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Sua conta de usuário</li>
                  <li>Dados de perfil (nome, email)</li>
                  <li>Histórico de progresso na jornada</li>
                  <li>Respostas do onboarding</li>
                  <li>Feedback e avaliações</li>
                  <li>Dados de assinatura</li>
                </ul>
              </div>

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

              <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                <strong>Importante:</strong> A exclusão é permanente e não pode ser desfeita. 
                Após a exclusão, você precisará criar uma nova conta caso deseje usar o aplicativo novamente.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccount;
