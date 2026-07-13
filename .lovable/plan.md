Vou implementar o Cérebro-Tamagotchi do Sopro com Sparks, níveis e estados Active/Resting, exatamente como no documento anexado. A ideia é que o cérebro seja o "próprio cérebro do usuário", crescendo e brilhando conforme ele interage com o app.

## 1. Banco de dados (via migration)

**Tabela `brain_sparks_config`** (valores configuráveis, editáveis via SQL sem deploy):
- `event_key` (pk): `video_completed`, `hypnosis_completed`, `mission_completed`, `mission_completed_with_mural_post`, `chat_message`, `mural_post`, `mural_comment`, `login_streak_2`, `login_streak_5`, `sos_used`
- `sparks_value` (int)
- `description` (text)
- Seed com valores iniciais do doc (5, 5, 5, 10, 10, 10, 10, 20, 10)

**Tabela `brain_levels_config`**:
- `level` (pk, 1–5), `min_sparks`, `max_sparks` (null no 5), `label`
- Seed: 0–25, 26–50, 51–75, 76–100, 101+

**Tabela `brain_sparks_log`** (histórico auditável e para debounce):
- `id`, `user_id`, `event_key`, `sparks_awarded`, `metadata jsonb`, `created_at`
- Índice em `(user_id, event_key, created_at)`

**Colunas em `profiles`**:
- `brain_sparks int default 0`
- `brain_last_active_at timestamptz default now()` (usado para Active/Resting)
- `brain_last_login_date date` e `brain_login_streak int default 0` (para streaks)

**Função RPC `award_sparks(p_event_key, p_metadata)`** (security definer):
- Busca valor em `brain_sparks_config`.
- Insere em `brain_sparks_log`.
- Incrementa `profiles.brain_sparks` (nunca decrementa).
- Atualiza `brain_last_active_at = now()`.
- Deduplicação: para eventos idempotentes por dia (ex: chat, sos, mural_post), checa se já existe log do mesmo `event_key` no mesmo dia antes de conceder.
- Retorna `{ sparks_awarded, total_sparks, level }`.

**Função `register_login_and_award()`**: chamada uma vez por dia no boot do app; calcula streak, concede `login_streak_2` ou `login_streak_5` quando aplicável.

Grants + RLS: SELECT próprio em log/profiles; INSERT/UPDATE apenas via RPC security definer.

## 2. Assets (10 imagens do cérebro)

Gerar via image tool 10 PNGs em `src/assets/brain/`:
- `brain-lv1-active.png` … `brain-lv5-active.png`
- `brain-lv1-resting.png` … `brain-lv5-resting.png`

Mantendo identidade visual da imagem de referência anexada: cérebro rosa fofo, cresce em tamanho/brilho/partículas do nível 1→5; resting = olhos fechados + Zzz. Sem lágrimas nem tristeza.

## 3. Frontend

**`src/hooks/useBrainSparks.tsx`** (novo):
- Retorna `{ sparks, level, state: 'active'|'resting', nextLevelAt, progressInLevel }`.
- Calcula state comparando `brain_last_active_at` com now (>24h = resting).
- Realtime subscription em `profiles` para atualizar ao vivo.
- Expõe `awardSparks(eventKey, metadata?)` que chama a RPC.

**`src/components/home/ProgressBrain.tsx`** (refactor):
- Troca o brain-user.png único por asset dinâmico baseado em `level` + `state`.
- Adiciona badge de Sparks (⚡ N) e barra fina de progresso até próximo nível abaixo do cérebro.
- Mantém arco de progresso da jornada por cima (não conflita — arco = jornada, sparks = crescimento vitalício).
- Animações: `active` = float + pulse; `resting` = respiração lenta + Zzz flutuando (via CSS keyframes já existentes + novo `zzz-float`).

**Novo componente `BrainEvolutionInfo.tsx`** + rota `/cerebro`:
- Explica os 5 níveis e como ganhar Sparks (renderiza a tabela vinda de `brain_*_config`).
- Botão de "?" ao lado do brain no Dashboard abre este modal/tela.

## 4. Integração dos gatilhos (award_sparks calls)

- `useJourneyTracking.updateProgress` quando `finished=true` → `video_completed` ou `hypnosis_completed`.
- Chat (`src/pages/Chat.tsx`) → `chat_message` (1x/dia).
- Missão concluída (fluxo em `Chat.tsx` mission mode + `Jornada.tsx`) → `mission_completed`; se também postou no mural na mesma missão → `mission_completed_with_mural_post` (concedido no lugar do simples, não somado).
- Mural (`useMural`) → `mural_post` e `mural_comment` ao inserir.
- SOS (`useSosHypnosis`) → `sos_used` (1x/dia).
- Boot do app (`useAuth` ou `App.tsx`) → `register_login_and_award()` 1x/dia.

## 5. Detalhes técnicos

- Valores nunca hardcoded no client: componente lê `brain_levels_config` via query cache (staleTime longo).
- Fase (redução/abstinência) não afeta cérebro — confirmado, `award_sparks` ignora fase.
- Sparks nunca diminui, nível nunca regride (garantido no SQL: `UPDATE ... SET brain_sparks = brain_sparks + v`).
- Trocar de estado (Active/Resting) é derivado em tempo real do timestamp, não persistido — evita jobs cron.

## O que fica fora deste PR (posso fazer em seguida)
- Analytics dashboard de Sparks por usuário para admin.
- Push notificação quando cérebro entra em Resting.
- Animações mais elaboradas (Lottie).

Confirma que posso seguir com essa estrutura? Se sim, sigo direto para a implementação — inclusive geração dos 10 assets de cérebro.