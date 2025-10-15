import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Lock, Sparkles } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";

interface UpgradeCardProps {
  onUpgrade: () => void;
}

const UpgradeCard = ({ onUpgrade }: UpgradeCardProps) => {
  return (
    <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-2">
          <Crown className="w-8 h-8 text-accent mr-2" />
          <CardTitle className="text-xl">Acesso Premium</CardTitle>
        </div>
        <CardDescription>
          Desbloqueie todo o programa de transformação
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">✓ Processo completo de 14 dias</p>
          <p className="text-sm text-muted-foreground">✓ Todas as hipnoses exclusivas</p>
          <p className="text-sm text-muted-foreground">✓ Explicações sobre neurociência do vício</p>
          <p className="text-sm text-muted-foreground">✓ Técnicas práticas para lidar com abstinência e gatilhos</p>
        </div>
        <Button 
          onClick={onUpgrade} 
          className="w-full" 
          variant="default"
        >
          <Crown className="w-4 h-4 mr-2" />
          Fazer Upgrade Agora
        </Button>
      </CardContent>
    </Card>
  );
};

interface ContentAccessWrapperProps {
  day: number;
  children: React.ReactNode;
  contentType: 'video' | 'hypnosis';
  contentId: string;
}

export const ContentAccessWrapper = ({ day, children, contentType, contentId }: ContentAccessWrapperProps) => {
  const { hasAccessToDay, upgradeRequired } = useUserProfile();

  const handleUpgrade = () => {
    // TODO: Implementar redirecionamento para página de pagamento
    console.log('Redirecionando para upgrade...');
  };

  if (upgradeRequired(day)) {
    return (
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-muted/50 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="text-center space-y-4 p-6">
            <Lock className="w-12 h-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">Conteúdo Premium</h3>
              <p className="text-sm text-muted-foreground">
                Faça upgrade para acessar este conteúdo
              </p>
            </div>
            <Button onClick={handleUpgrade} size="sm">
              <Crown className="w-4 h-4 mr-2" />
              Fazer Upgrade
            </Button>
          </div>
        </div>
        <div className="opacity-30">
          {children}
        </div>
      </Card>
    );
  }

  if (hasAccessToDay(day)) {
    return <>{children}</>;
  }

  return (
    <Card className="border-muted">
      <CardContent className="p-6 text-center">
        <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground">Conteúdo não disponível</p>
      </CardContent>
    </Card>
  );
};

export default UpgradeCard;