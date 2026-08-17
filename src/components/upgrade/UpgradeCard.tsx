import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Lock } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useIsNativeIOS } from "@/hooks/useIsNativeIOS";
import { SubscriptionButton } from "./SubscriptionButton";

const UpgradeCard = () => {
  const isNativeIOS = useIsNativeIOS();

  // Hide upgrade card on native iOS (Apple requires IAP)
  if (isNativeIOS) {
    return null;
  }

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
          <p className="text-sm text-muted-foreground">✓ Jornada completa com todos os conteúdos</p>
          <p className="text-sm text-muted-foreground">✓ Todas as hipnoses exclusivas</p>
          <p className="text-sm text-muted-foreground">✓ Explicações sobre neurociência do vício</p>
          <p className="text-sm text-muted-foreground">✓ Técnicas práticas para lidar com abstinência e gatilhos</p>
        </div>
        <SubscriptionButton size="lg" />
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
  const isNativeIOS = useIsNativeIOS();

  if (upgradeRequired(day)) {
    return (
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-muted/50 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="text-center space-y-4 p-6">
            <Lock className="w-12 h-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">Conteúdo Premium</h3>
              <p className="text-sm text-muted-foreground">
                {isNativeIOS 
                  ? "Este conteúdo requer acesso premium"
                  : "Faça upgrade para acessar este conteúdo"
                }
              </p>
            </div>
            {!isNativeIOS && <SubscriptionButton />}
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