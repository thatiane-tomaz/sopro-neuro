-- ============================================
-- CORREÇÃO DE SEGURANÇA: Prevenir manipulação de assinaturas
-- ============================================

-- 1. Primeiro, dropar todas as políticas existentes para recriar corretamente
DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile name only" ON public.profiles;
DROP POLICY IF EXISTS "Only admins can insert subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Only admins can update subscriptions" ON public.subscriptions;

-- 2. Criar política segura para profiles: usuários podem atualizar APENAS display_name
CREATE POLICY "Users can update profile name only"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id 
  AND subscription_status = (SELECT subscription_status FROM public.profiles WHERE user_id = auth.uid())
);

-- 3. Apenas admins podem modificar subscriptions (INSERT/UPDATE)
CREATE POLICY "Admins only can insert subscriptions"
ON public.subscriptions
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins only can update subscriptions"
ON public.subscriptions
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));