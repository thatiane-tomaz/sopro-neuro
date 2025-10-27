import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Privacy = () => {
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
          <h1 className="text-4xl font-bold mb-6">Política de Privacidade</h1>
          <p className="text-muted-foreground mb-8">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Informações que Coletamos</h2>
            <p className="mb-4">
              A sua privacidade é importante para nós. Esta política descreve como coletamos, 
              usamos e protegemos suas informações pessoais.
            </p>
            
            <h3 className="text-xl font-semibold mb-3 mt-6">1.1 Informações Fornecidas por Você</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Cadastro:</strong> nome, email, senha</li>
              <li><strong>Onboarding:</strong> respostas ao questionário inicial (motivação, histórico de tabagismo)</li>
              <li><strong>Uso do App:</strong> progresso nas fases, dias completados, conteúdo acessado</li>
              <li><strong>Pagamento:</strong> informações de faturamento (processadas por terceiros seguros)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">1.2 Informações Coletadas Automaticamente</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Dados de uso: páginas visitadas, tempo de uso, recursos acessados</li>
              <li>Informações técnicas: tipo de dispositivo, navegador, endereço IP</li>
              <li>Cookies e tecnologias similares para melhorar a experiência</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Como Usamos Suas Informações</h2>
            <p className="mb-4">Utilizamos suas informações para:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Fornecer o serviço:</strong> personalizar conteúdo, acompanhar progresso, liberar fases</li>
              <li><strong>Melhorar o app:</strong> análise de uso, desenvolvimento de novos recursos</li>
              <li><strong>Comunicação:</strong> notificações importantes, suporte, atualizações do serviço</li>
              <li><strong>Segurança:</strong> prevenir fraudes, proteger usuários</li>
              <li><strong>Conformidade legal:</strong> cumprir obrigações legais e regulatórias</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Compartilhamento de Informações</h2>
            <p className="mb-4 font-semibold">
              Nós NÃO vendemos suas informações pessoais.
            </p>
            <p className="mb-4">Podemos compartilhar dados apenas com:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Provedores de serviço:</strong> hospedagem (Supabase), pagamentos, analytics</li>
              <li><strong>Obrigações legais:</strong> quando exigido por lei ou ordem judicial</li>
              <li><strong>Proteção de direitos:</strong> para proteger direitos, propriedade ou segurança</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Dados Sensíveis de Saúde</h2>
            <p className="mb-4 font-semibold text-amber-600 dark:text-amber-500">
              Coletamos informações sobre seu histórico de tabagismo e progresso no programa.
            </p>
            <p className="mb-4">
              Tratamos estes dados com segurança máxima, em conformidade com a LGPD (Lei Geral de 
              Proteção de Dados). Esses dados são:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Criptografados em trânsito e em repouso</li>
              <li>Acessíveis apenas por você e equipe autorizada</li>
              <li>Nunca compartilhados para fins comerciais</li>
              <li>Utilizados apenas para personalizar sua experiência</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Segurança dos Dados</h2>
            <p className="mb-4">Implementamos medidas de segurança incluindo:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Criptografia SSL/TLS para transmissão de dados</li>
              <li>Criptografia de senhas com hash seguro</li>
              <li>Controles de acesso rigorosos</li>
              <li>Monitoramento de segurança contínuo</li>
              <li>Backup regular dos dados</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Seus Direitos (LGPD)</h2>
            <p className="mb-4">Você tem direito a:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Acesso:</strong> solicitar cópia de seus dados pessoais</li>
              <li><strong>Correção:</strong> atualizar dados incorretos ou incompletos</li>
              <li><strong>Exclusão:</strong> solicitar exclusão de seus dados (exceto quando houver obrigação legal de retenção)</li>
              <li><strong>Portabilidade:</strong> receber seus dados em formato estruturado</li>
              <li><strong>Revogação de consentimento:</strong> retirar consentimento a qualquer momento</li>
              <li><strong>Oposição:</strong> opor-se ao tratamento de seus dados em certas situações</li>
            </ul>
            <p className="mb-4">
              Para exercer seus direitos, entre em contato através de: privacidade@sopro.app
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Retenção de Dados</h2>
            <p className="mb-4">
              Mantemos seus dados pelo tempo necessário para:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Fornecer o serviço enquanto sua conta estiver ativa</li>
              <li>Cumprir obrigações legais (ex: dados fiscais por 5 anos)</li>
              <li>Resolver disputas e fazer cumprir acordos</li>
            </ul>
            <p className="mb-4">
              Após o cancelamento da conta, dados não essenciais são excluídos em até 90 dias.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Cookies e Tecnologias Similares</h2>
            <p className="mb-4">Utilizamos cookies para:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Manter você conectado</li>
              <li>Lembrar suas preferências</li>
              <li>Analisar uso do aplicativo</li>
              <li>Melhorar funcionalidades</li>
            </ul>
            <p className="mb-4">
              Você pode gerenciar cookies através das configurações do seu navegador.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Transferência Internacional de Dados</h2>
            <p className="mb-4">
              Seus dados podem ser armazenados em servidores localizados fora do Brasil, 
              incluindo nos Estados Unidos (Supabase). Garantimos que todos os fornecedores 
              cumpram padrões adequados de proteção de dados.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Menores de Idade</h2>
            <p className="mb-4">
              O Sopro é destinado a maiores de 18 anos. Não coletamos intencionalmente 
              informações de menores de idade.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Alterações nesta Política</h2>
            <p className="mb-4">
              Podemos atualizar esta política periodicamente. Alterações significativas serão 
              comunicadas por email ou notificação no app. Recomendamos revisar esta página 
              regularmente.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Contato e Encarregado de Dados</h2>
            <p className="mb-4">
              Para questões sobre privacidade ou exercício de direitos LGPD:
            </p>
            <p className="mb-2"><strong>Email:</strong> privacidade@sopro.app</p>
            <p className="mb-2"><strong>Suporte geral:</strong> contato@sopro.app</p>
            <p className="mb-4 mt-4">
              <strong>Encarregado de Proteção de Dados (DPO):</strong> [Nome do DPO] - dpo@sopro.app
            </p>
          </section>
        </article>
      </div>
    </main>
  );
};

export default Privacy;
