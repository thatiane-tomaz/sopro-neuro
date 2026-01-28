# Sopro Neuro - Documentação Técnica

## Visão Geral

App de hipnoterapia para cessação do tabagismo com conteúdo diário (21 dias), sistema de assinaturas via Stripe, e autenticação via Supabase.

**Stack:** React 18 + Vite + TypeScript + Tailwind CSS + Supabase + Capacitor (iOS/Android)

---

## Estrutura do Projeto

```
src/
├── components/          # Componentes React
│   ├── ui/              # Componentes shadcn/ui
│   ├── onboarding/      # Fluxo de onboarding (5 perguntas)
│   └── upgrade/         # Componentes de upgrade/assinatura
├── hooks/               # Custom hooks
├── pages/               # Páginas/rotas
├── integrations/        # Cliente Supabase
├── data/                # Dados estáticos (journeyData, feedbackQuestions)
├── lib/                 # Utilitários
└── assets/              # Imagens estáticas

supabase/
└── functions/           # Edge Functions (Deno)
```

---

## Banco de Dados (Supabase)

### Tabelas Principais

| Tabela | Descrição | RLS |
|--------|-----------|-----|
| `profiles` | Dados do usuário (display_name, email, onesignal_player_id) | User próprio |
| `subscriptions` | Assinaturas Stripe (status, expires_at, stripe_customer_id) | User próprio (SELECT), Admin/Service (INSERT/UPDATE) |
| `journey_tracking` | Progresso do usuário nos vídeos/hipnoses | User próprio |
| `onboarding_responses` | Respostas do onboarding | User próprio |
| `daily_content` | Conteúdo diário (títulos, duração) | Público (SELECT) |
| `phases` | Fases do programa (1-3) | Público (SELECT) |
| `triggers_content` | Conteúdo de gatilhos/SOS | Público (SELECT) |
| `feedback_responses` | Feedback diário do usuário | User próprio |
| `freelist_users` | Usuários com acesso gratuito | User próprio email |
| `user_roles` | Roles (admin, user) | User próprio |
| `app_sessions` | Tracking de sessões abertas | User próprio |
| `content_views` | Tracking de visualizações | User próprio |
| `deleted_accounts` | Registro de contas deletadas | Admin/Service |

### Enums

```sql
app_role: 'admin' | 'moderator' | 'user'
subscription_status: 'free' | 'premium' | 'cancelled' | 'expired'
cancellation_reason: 'user_request' | 'payment_failed' | 'expired' | 'upgrade' | 'downgrade' | 'admin_action'
```

### Funções do Banco

| Função | Descrição |
|--------|-----------|
| `is_day_completed(user_id, day)` | Verifica se dia foi concluído (vídeo + hipnose >= 98%) |
| `get_day_completion_time(user_id, day)` | Retorna timestamp de conclusão do dia |
| `get_current_subscription(user_id)` | Retorna assinatura ativa do usuário |
| `has_role(user_id, role)` | Verifica se usuário tem determinada role |

---

## Edge Functions

### Autenticação

#### `custom-signup`
Cadastro customizado com verificação de assinatura pré-existente.

```typescript
POST /functions/v1/custom-signup
Body: { email: string, password: string, displayName: string }
Response: { success: boolean, message: string }
```

#### `custom-password-reset`
Reset de senha com email customizado.

```typescript
POST /functions/v1/custom-password-reset
Body: { email: string }
Response: { success: boolean }
```

#### `resend-confirmation-email`
Reenvia email de confirmação de cadastro.

```typescript
POST /functions/v1/resend-confirmation-email
Body: { email: string }
Response: { success: boolean }
```

### Pagamentos (Stripe)

#### `create-checkout`
Cria sessão de checkout Stripe (pagamento único, não recorrente).

```typescript
POST /functions/v1/create-checkout
Headers: Authorization: Bearer <jwt>
Body: { priceId?: string }
Response: { url: string }
```

#### `verify-payment`
Webhook Stripe para verificar pagamento e criar/atualizar assinatura.

```typescript
POST /functions/v1/verify-payment
Headers: stripe-signature
Body: Stripe Event
```

#### `check-subscription`
Verifica status da assinatura do usuário.

```typescript
POST /functions/v1/check-subscription
Headers: Authorization: Bearer <jwt>
Response: { hasActiveSubscription: boolean, subscription?: object }
```

#### `customer-portal`
Gera link para portal do cliente Stripe.

```typescript
POST /functions/v1/customer-portal
Headers: Authorization: Bearer <jwt>
Response: { url: string }
```

#### `request-refund`
Solicita reembolso.

```typescript
POST /functions/v1/request-refund
Headers: Authorization: Bearer <jwt>
Body: { reason: string }
Response: { success: boolean }
```

### Emails (Resend)

#### `send-welcome-email`
Email de boas-vindas após confirmação.

#### `send-refund-confirmation-email`
Email de confirmação de reembolso.

### Outros

#### `delete-user-by-email`
Deleta conta do usuário (compliance Apple/Google).

```typescript
POST /functions/v1/delete-user-by-email
Headers: Authorization: Bearer <jwt>
Response: { success: boolean }
```

#### `send-inactive-user-notifications`
CRON job para notificar usuários inativos (OneSignal).

```typescript
POST /functions/v1/send-inactive-user-notifications
Headers: Authorization: Bearer <CRON_SECRET>
```

---

## Hooks Customizados

| Hook | Descrição |
|------|-----------|
| `useAuth` | Autenticação (user, signIn, signUp, signOut, loading) |
| `useSubscription` | Status da assinatura (hasAccess, isLoading, subscription) |
| `useJourneyTracking` | Tracking de progresso (updateProgress, isCompleted) |
| `useDailyContent` | Dados do conteúdo diário |
| `useOnboardingData` | Respostas do onboarding |
| `useUserProfile` | Perfil do usuário |
| `usePhases` | Fases do programa |
| `useTriggersContent` | Conteúdo de gatilhos |
| `useFeedback` | Feedback diário |
| `useContentTracking` | Tracking de visualizações |
| `useIsAdmin` | Verifica se é admin |
| `useIsNativeIOS` | Detecta se está no app iOS nativo |

---

## Fluxos Principais

### 1. Autenticação
```
Landing (soproneuro.com.br) → Pagamento Stripe → 
App Login → Verificação subscription → Dashboard
```

### 2. Primeiro Acesso
```
Login → Onboarding (5 perguntas) → Dashboard Dia 1
```

### 3. Jornada Diária
```
Dashboard → Seleciona dia → Vídeo (tracking) → 
Hipnose (tracking) → Feedback → Próximo dia liberado
```

### 4. Expiração
```
7 dias antes: Warning banner
Expirado: Conteúdo bloqueado (dia 3+) → Upgrade flow
```

---

## Storage Buckets

| Bucket | Público | Conteúdo |
|--------|---------|----------|
| `videos` | Sim | Vídeos diários (.mp4) |
| `hypnosis` | Sim | Áudios de hipnose (.mp3) |
| `images` | Sim | Imagens do app |

**Padrão de nomes:**
- Vídeos: `video_dia_{n}.mp4`
- Hipnoses: `hipnose_dia_{n}.mp3`

---

## Secrets (Edge Functions)

| Secret | Uso |
|--------|-----|
| `STRIPE_SECRET_KEY` | API Stripe |
| `RESEND_API_KEY` | Envio de emails |
| `ONESIGNAL_APP_ID` | Push notifications |
| `ONESIGNAL_REST_API_KEY` | Push notifications |
| `CRON_SECRET` | Autenticação CRON jobs |
| `SUPABASE_SERVICE_ROLE_KEY` | Operações admin |

---

## Rotas

| Rota | Componente | Auth |
|------|------------|------|
| `/` | Index (landing) | Não |
| `/login` | Login/Signup | Não |
| `/dashboard` | Dashboard principal | Sim |
| `/onboarding` | Onboarding | Sim |
| `/settings` | Configurações | Sim |
| `/install` | Instruções PWA | Não |
| `/payment-success` | Sucesso pagamento | Sim |
| `/email-confirmed` | Email confirmado | Não |
| `/terms` | Termos de uso | Não |
| `/privacy` | Política privacidade | Não |
| `/delete-account` | Deletar conta | Opcional |

---

## Modelo de Negócio

- **Pagamento único** (não recorrente) por período de 30 dias
- Assinatura criada via landing page externa (soproneuro.com.br)
- App verifica assinatura no login/signup
- Usuários na `freelist_users` têm acesso gratuito
- Dias 1-2 sempre liberados, dia 3+ requer assinatura ativa

---

## Setup Local

```bash
# Instalar dependências
npm install

# Rodar dev server
npm run dev

# Build para produção
npm run build
```

---

## Capacitor (Mobile)

```bash
# Sync com plataformas nativas
npx cap sync

# Abrir Android Studio
npx cap open android

# Abrir Xcode
npx cap open ios
```

**Project ID:** `kpewsvpufzkyejchncta`
**Preview:** https://sopro-neuro.lovable.app
