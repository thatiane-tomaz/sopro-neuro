## Objetivo
Introduzir duas jornadas (redução e abstinência) definidas no onboarding, com histórico de mudanças. Sem apagar dados antigos.

## 1. Nova pergunta no onboarding (última)
Novo componente `Question7.tsx` — pergunta única com 2 opções:
- **"Ainda fumo e quero reduzir até me sentir pronto para parar"** → `reducao`
- **"Já parei de fumar e quero apoio para me manter firme"** → `abstinencia`

Fluxo em `src/pages/Onboarding.tsx`:
- Adiciona `journeyType: "reducao" | "abstinencia" | ""` em `OnboardingData`
- Aumenta para 8 telas: reordena para que Q7 (nova pergunta) fique como a última antes da `CompletionScreen` (que passa a ser tela 8)
- No submit (`finishOnboarding`), grava também na nova tabela e cria a primeira linha de histórico de jornada

## 2. Nova tabela `onboarding_responses_v2`
Mantém `onboarding_responses` intocada. Novos usuários (a partir de agora) gravam aqui.

Colunas (além de id/created_at/updated_at):
- `user_id uuid` (FK lógica → auth.users)
- `email text`
- `respostas jsonb` — payload completo do onboarding (idade, gênero, cigarros/dia, vapes/mês, tipos, motivos, medos, gasto semanal, etc.)
- `jornada_inicial text` — `'reducao'` ou `'abstinencia'`

RLS: usuário vê/insere apenas as próprias linhas; service_role acesso total.

## 3. Nova tabela `historico_jornada_usuario`
Registra jornada atual e cada mudança.

Colunas:
- `user_id uuid`
- `jornada text` — `'reducao'` ou `'abstinencia'`
- `created_at timestamptz` — momento da mudança/criação

Regra de uso: no fim do onboarding cria a primeira linha. Toda troca futura (fumar último cigarro / voltou a fumar) insere nova linha — nunca atualiza a anterior. A jornada atual do usuário = linha mais recente por `created_at`.

RLS: usuário vê/insere apenas as próprias linhas; service_role total.

## 4. Escopo desta etapa
Somente onboarding + tabelas. **Não** vou ainda:
- Alterar Dashboard para reagir à jornada
- Criar os botões "fumei último cigarro" (já existe um) / "voltei a fumar" com registro na nova tabela
- Filtrar `habitos_jornada` por `tipo_usuario` com base na jornada atual

Esses passos ficam para os próximos prompts, depois que a base estiver aprovada.

## Detalhes técnicos
- Migração cria as 2 tabelas com GRANTs (`authenticated`, `service_role`) e RLS por `auth.uid() = user_id`.
- Índice em `historico_jornada_usuario(user_id, created_at desc)` para leitura rápida da jornada atual.
- `respostas jsonb` evita duplicar colunas do schema antigo e permite evoluir sem migração.
- Admin em modo preview continua sem gravar (mantém comportamento atual).
