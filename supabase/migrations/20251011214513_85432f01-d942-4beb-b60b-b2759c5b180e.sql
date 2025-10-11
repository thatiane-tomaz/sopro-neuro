-- Verificar e atualizar configuração de confirmação de email
-- Atualizar a configuração do Supabase para não exigir confirmação de email

-- Nota: Esta é uma query de verificação. 
-- A configuração real de "Confirm email" precisa ser alterada no painel do Supabase.
-- Mas podemos confirmar manualmente o email de usuários existentes:

-- Primeiro, vamos ver os usuários não confirmados
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email_confirmed_at IS NULL
LIMIT 5;