import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Terms = () => {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>

        <article className="prose prose-slate dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-6">Termos de Uso</h1>
          <p className="text-muted-foreground mb-8">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Aceitação dos Termos</h2>
            <p className="mb-4">
              Ao acessar e utilizar o Sopro, você concorda em cumprir estes Termos de Uso. 
              Se você não concorda com qualquer parte destes termos, não deve utilizar nosso serviço.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Descrição do Serviço</h2>
            <p className="mb-4">
              O Sopro é um programa digital de 14 dias baseado em neurociência e hipnose clínica 
              para auxiliar pessoas que desejam parar de fumar. O serviço inclui:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Conteúdo diário em áudio e vídeo</li>
              <li>Sessões de hipnose guiada</li>
              <li>Material educativo sobre neurociência</li>
              <li>Ferramentas de acompanhamento de progresso</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Aviso Importante de Saúde</h2>
            <p className="mb-4 font-semibold text-amber-600 dark:text-amber-500">
              O Sopro NÃO substitui tratamento médico, psicológico ou psiquiátrico.
            </p>
            <p className="mb-4 font-semibold text-amber-600 dark:text-amber-500">
              O aplicativo NÃO GARANTE CURA ou resultados definitivos. O Sopro é uma ferramenta 
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
            <h2 className="text-2xl font-semibold mb-4">4. Planos e Pagamentos</h2>
            <p className="mb-4">
              O Sopro oferece dois planos:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Plano Gratuito:</strong> Acesso aos primeiros 2 dias do programa</li>
              <li><strong>Plano Premium:</strong> Acesso completo aos 14 dias do programa por 30 dias</li>
            </ul>
            <p className="mb-4">
              O Plano Premium é uma compra única que concede acesso por 30 dias. Não há cobrança 
              recorrente ou renovação automática. Após o término dos 30 dias, caso deseje continuar 
              utilizando o serviço, você deverá realizar um novo pagamento.
            </p>
            <p className="mb-4">
              Os valores e formas de pagamento são apresentados claramente no momento da contratação.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Propriedade Intelectual</h2>
            <p className="mb-4">
              Todo o conteúdo do Sopro (textos, áudios, vídeos, imagens, código) é protegido 
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
              O Sopro não garante cura, resultados específicos ou que você conseguirá parar de fumar. 
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
            <h2 className="text-2xl font-semibold mb-4">8. Modificações dos Termos</h2>
            <p className="mb-4">
              Reservamos o direito de modificar estes termos a qualquer momento. 
              Alterações significativas serão comunicadas por email ou através da plataforma.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Expiração do Acesso e Encerramento</h2>
            <p className="mb-4">
              O acesso Premium expira automaticamente após 30 dias da compra. Não há renovação 
              automática nem cobranças recorrentes. Para continuar usando o serviço após a expiração, 
              é necessário realizar uma nova compra. Nós podemos suspender ou encerrar sua conta 
              em caso de violação destes termos.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Lei Aplicável</h2>
            <p className="mb-4">
              Estes termos são regidos pelas leis brasileiras. Eventuais disputas serão 
              resolvidas no foro da comarca de [sua cidade], com renúncia a qualquer outro.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Contato</h2>
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
