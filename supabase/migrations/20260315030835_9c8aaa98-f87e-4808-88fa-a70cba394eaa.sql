
-- Adicionar constraint para garantir apenas uma assinatura ativa por usuário
-- Primeiro, verificar se existem duplicados que precisam ser tratados

-- Se não houver duplicados de status 'premium'/'free' para o mesmo user_id,
-- podemos adicionar uma constraint única parcial

-- Criar índice único parcial para assinaturas ativas
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_subscription_per_user 
ON subscriptions (user_id) 
WHERE status IN ('premium', 'free') AND user_id IS NOT NULL;
