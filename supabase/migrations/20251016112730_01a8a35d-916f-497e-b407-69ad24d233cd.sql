-- ============================================
-- CORREÇÃO DE SEGURANÇA: Prevenir manipulação de assinaturas
-- ============================================

-- 1. Remover políticas que permitem usuários modificarem suas próprias assinaturas
DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.subscriptions;

-- 2. Remover política que permite atualizar perfil (vamos recriar com restrições)
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- 3. Criar nova política para profiles: usuários podem atualizar APENAS display_name
-- NÃO podem atualizar subscription_status
CREATE POLICY "Users can update their own profile name only"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id 
  AND subscription_status = (SELECT subscription_status FROM public.profiles WHERE user_id = auth.uid())
);

-- 4. Apenas admins podem modificar subscriptions (INSERT/UPDATE)
-- Usuários continuam podendo VER suas assinaturas, mas não modificar
CREATE POLICY "Only admins can insert subscriptions"
ON public.subscriptions
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update subscriptions"
ON public.subscriptions
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. Criar comentários explicativos
COMMENT ON POLICY "Users can update their own profile name only" ON public.profiles IS 
'Usuários podem atualizar apenas display_name. subscription_status é read-only para usuários comuns.';

COMMENT ON POLICY "Only admins can insert subscriptions" ON public.subscriptions IS 
'Apenas admins podem criar assinaturas. Previne usuários de criarem assinaturas premium falsas.';

COMMENT ON POLICY "Only admins can update subscriptions" ON public.subscriptions IS 
'Apenas admins podem modificar assinaturas. Previne manipulação de status de pagamento.';