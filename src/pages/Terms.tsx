import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const Terms = () => {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex justify-end mb-4">
          <Link to="/" aria-label="Fechar">
            <Button variant="ghost" size="icon" className="h-11 w-11 rounded-full text-primary hover:bg-muted">
              <X className="h-5 w-5" />
            </Button>
          </Link>
        </div>

        <article className="prose prose-slate dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-6">Termos de Uso</h1>
          <p className="text-muted-foreground mb-8">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Aceitação dos Termos</h2>
            <p className="mb-4">
              Ao acessar e utilizar o Sopro Neuro, você concorda em cumprir estes Termos de Uso e o 
              Contrato de Licença de Usuário Final (EULA) padrão da Apple, disponível em{" "}
              <a 
                href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
              </a>. 
              Se você não concorda com qualquer parte destes termos, não deve utilizar nosso serviço.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Descrição do Serviço</h2>
            <p className="mb-4">
              O Sopro Neuro é um programa digital de 21 dias baseado em neurociência e hipnose clínica 
              para auxiliar pessoas que desejam parar de fumar. O serviço inclui:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Conteúdo diário em áudio e vídeo</li>
              <li>Sessões de hipnose guiada</li>
              <li>Material educativo sobre neurociência</li>
              <li>Ferramentas de acompanhamento de progresso</li>
              <li>Ferramentas de suporte para lidar com a abstinência e os gatilhos do tabagismo</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Aviso Importante de Saúde</h2>
            <p className="mb-4 font-semibold text-amber-600 dark:text-amber-500">
              O Sopro Neuro NÃO substitui tratamento médico, psicológico ou psiquiátrico.
            </p>
            <p className="mb-4 font-semibold text-amber-600 dark:text-amber-500">
              O aplicativo NÃO GARANTE CURA ou resultados definitivos. O Sopro Neuro é uma ferramenta 
              de apoio que pode auxiliar no processo de parar de fumar quando utilizado de acordo 
              com as orientações fornecidas.
            </p>
            <p className="mb-4">
              Nosso programa é uma ferramenta de apoio comportamental baseada em técnicas de neurociência 
              e hipnose clínica. Os resultados variam de pessoa para pessoa e dependem do comprometimento 
              individual com o processo.
            </p>
            <p className="mb-4">
              Frases utilizadas no programa como "fume o último cigarro" e "Você já é um ex-fumante" 
              são recursos linguísticos importantes para assimilação dos conceitos e aumento da confiança 
              durante o processo. Essas expressões NÃO constituem promessas de resultado, mas sim 
              técnicas de reforço positivo comumente utilizadas em programas de mudança comportamental.
            </p>
            <p className="mb-4">
              Se você possui condições médicas, está em tratamento ou toma medicamentos, consulte seu 
              médico antes de iniciar o programa.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Planos, Assinaturas e Pagamentos</h2>
            <p className="mb-4">
              O Sopro Neuro oferece os seguintes planos:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Plano Gratuito:</strong> Acesso aos primeiros 2 dias do programa</li>
              <li><strong>Plano Premium (Assinatura Mensal):</strong> Acesso completo a todo o conteúdo do programa, incluindo os 21 dias, sessões de hipnose e ferramentas de suporte para abstinência</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">4.1 Assinatura Auto-Renovável</h3>
            <p className="mb-4">
              O Plano Premium é uma assinatura auto-renovável mensal. Ao assinar, você autoriza a 
              cobrança recorrente mensal até que a assinatura seja cancelada.
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>O pagamento será cobrado na sua conta do iTunes/Apple ID ou Google Play no momento da confirmação da compra.</li>
              <li>A assinatura é renovada automaticamente a cada mês, a menos que seja cancelada pelo menos 24 horas antes do final do período vigente.</li>
              <li>O valor da renovação será cobrado na sua conta dentro de 24 horas antes do final do período atual.</li>
              <li>Você pode gerenciar e cancelar suas assinaturas acessando as configurações da sua conta na App Store (iOS) ou Google Play Store (Android) após a compra.</li>
              <li>Qualquer parte não utilizada de um período de teste gratuito, se oferecido, será perdida quando você adquirir uma assinatura.</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">4.2 Cancelamento</h3>
            <p className="mb-4">
              O cancelamento da assinatura pode ser feito a qualquer momento através das configurações 
              da sua conta na loja de aplicativos correspondente (App Store ou Google Play Store). 
              Após o cancelamento, você continuará tendo acesso ao conteúdo até o final do período 
              já pago. Não há reembolso proporcional por períodos parciais não utilizados.
            </p>
            <p className="mb-4">
              Excluir o aplicativo do seu dispositivo ou excluir sua conta no Sopro Neuro NÃO cancela 
              automaticamente a assinatura. Você deve cancelar diretamente na loja de aplicativos.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">4.3 Valores</h3>
            <p className="mb-4">
              Os valores e formas de pagamento são apresentados claramente no momento da contratação 
              dentro do aplicativo. Os preços podem variar de acordo com a região e a moeda local.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Propriedade Intelectual</h2>
            <p className="mb-4">
              Todo o conteúdo do Sopro Neuro (textos, áudios, vídeos, imagens, código) é protegido 
              por direitos autorais e propriedade intelectual. É proibido:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Copiar, reproduzir ou distribuir o conteúdo</li>
              <li>Compartilhar credenciais de acesso</li>
              <li>Fazer download não autorizado dos materiais</li>
              <li>Usar o conteúdo para fins comerciais</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Responsabilidades do Usuário</h2>
            <p className="mb-4">Você concorda em:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Fornecer informações verdadeiras e atualizadas</li>
              <li>Manter a confidencialidade de sua senha</li>
              <li>Usar o serviço apenas para fins pessoais e legais</li>
              <li>Não tentar acessar áreas restritas do sistema</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Limitação de Responsabilidade</h2>
            <p className="mb-4 font-semibold text-amber-600 dark:text-amber-500">
              O Sopro Neuro não garante cura, resultados específicos ou que você conseguirá parar de fumar. 
              O aplicativo é uma ferramenta de apoio que pode auxiliar no processo quando seguido 
              corretamente.
            </p>
            <p className="mb-4">
              Os resultados podem variar significativamente de pessoa para pessoa, dependendo de 
              diversos fatores individuais incluindo comprometimento, histórico de tabagismo, 
              condições de saúde e circunstâncias pessoais.
            </p>
            <p className="mb-4">
              Não nos responsabilizamos por:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Resultados individuais do programa ou falta de resultados</li>
              <li>Decisões tomadas com base no conteúdo</li>
              <li>Recaídas ou dificuldades no processo de cessação do tabagismo</li>
              <li>Interrupções temporárias do serviço</li>
              <li>Problemas técnicos ou de conectividade</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Política de Privacidade</h2>
            <p className="mb-4">
              O uso do Sopro Neuro está sujeito à nossa{" "}
              <Link to="/privacy" className="text-primary underline">
                Política de Privacidade
              </Link>, que descreve como coletamos, usamos e protegemos seus dados pessoais.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Modificações dos Termos</h2>
            <p className="mb-4">
              Reservamos o direito de modificar estes termos a qualquer momento. 
              Alterações significativas serão comunicadas por email ou através da plataforma.
              O uso continuado do serviço após as alterações constitui aceitação dos novos termos.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Expiração do Acesso e Encerramento</h2>
            <p className="mb-4">
              O acesso Premium permanece ativo enquanto a assinatura estiver vigente. Caso a assinatura 
              seja cancelada ou não renovada, o acesso ao conteúdo premium será encerrado ao final do 
              período pago. Nós podemos suspender ou encerrar sua conta em caso de violação destes termos.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Lei Aplicável</h2>
            <p className="mb-4">
              Estes termos são regidos pelas leis brasileiras. Eventuais disputas serão 
              resolvidas no foro da comarca de São Paulo/SP, com renúncia a qualquer outro.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Contato</h2>
            <p className="mb-4">
              Para questões sobre estes Termos de Uso, entre em contato:
            </p>
            <p className="mb-2">Email: contato@soproneuro.com.br</p>
          </section>
        </article>
      </div>
    </main>
  );
};

export default Terms;
