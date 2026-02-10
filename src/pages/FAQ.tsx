import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { X, Smartphone, Wifi, WifiOff, Battery, BellOff, Headphones, Mail } from 'lucide-react';

const FAQ = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-semibold text-foreground">Perguntas Frequentes</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
            className="rounded-full"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Troubleshooting: Video/Hypnosis freezing */}
        <section className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="bg-primary/5 px-5 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <WifiOff className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Vídeo ou hipnose travando</h2>
                <p className="text-xs text-muted-foreground">Soluções para interrupções durante a reprodução</p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <p className="text-sm text-muted-foreground">
              Se o vídeo ou a hipnose trava durante a reprodução, isso geralmente está relacionado 
              às configurações do seu celular que interrompem a conexão de internet ou suspendem o app 
              em segundo plano. Siga os passos abaixo para resolver:
            </p>

            {/* Step 1 */}
            <div className="flex gap-3 bg-accent/30 rounded-xl p-4">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Battery className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">1. Desative a Economia de Bateria</p>
                <p className="text-xs text-muted-foreground mt-1">
                  <strong>Android:</strong> Configurações → Apps → SoPro Neuro → Bateria → Sem restrições
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  <strong>iPhone:</strong> Ajustes → Bateria → Desative "Modo de Baixa Energia"
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-3 bg-accent/30 rounded-xl p-4">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Wifi className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">2. Mantenha o WiFi ativo durante a suspensão</p>
                <p className="text-xs text-muted-foreground mt-1">
                  <strong>Android:</strong> Configurações → WiFi → Avançado → Manter WiFi durante suspensão → Sempre
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  <strong>iPhone:</strong> O WiFi permanece ativo por padrão. Se usar dados móveis, 
                  verifique se o sinal está estável.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-3 bg-accent/30 rounded-xl p-4">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Smartphone className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">3. Desative "Apps em suspensão"</p>
                <p className="text-xs text-muted-foreground mt-1">
                  <strong>Samsung:</strong> Configurações → Cuidados com o dispositivo → Bateria → Limites de uso em segundo plano → Remova o SoPro da lista
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  <strong>Xiaomi:</strong> Configurações → Apps → Gerenciar apps → SoPro → Economia de bateria → Sem restrições
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-3 bg-accent/30 rounded-xl p-4">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <BellOff className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">4. Ative o "Não Perturbe"</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Notificações de outros apps podem interromper a reprodução do áudio. 
                  Ative o modo "Não Perturbe" antes de iniciar a hipnose.
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="flex gap-3 bg-accent/30 rounded-xl p-4">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Headphones className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">5. Use fones de ouvido</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Fones de ouvido (com fio ou Bluetooth) ajudam a manter o foco do áudio no app 
                  e evitam que o sistema redirecione o som para outro aplicativo.
                </p>
              </div>
            </div>

            <div className="bg-muted/50 rounded-xl p-4 mt-2">
              <p className="text-xs text-muted-foreground">
                💡 <strong>Dica:</strong> Se o problema persistir, tente fechar outros apps antes de iniciar 
                a sessão e certifique-se de estar em uma rede WiFi estável.
              </p>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Ainda tem dúvidas?</p>
              <p className="text-xs text-muted-foreground">
                Envie sua pergunta para{' '}
                <a 
                  href="mailto:contato@soproneuro.com.br" 
                  className="text-primary font-medium underline"
                >
                  contato@soproneuro.com.br
                </a>
              </p>
            </div>
          </div>
        </section>

        <div className="h-8" />
      </div>
    </div>
  );
};

export default FAQ;
