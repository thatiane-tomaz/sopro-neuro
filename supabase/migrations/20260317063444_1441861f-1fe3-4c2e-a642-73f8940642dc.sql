
-- Tabela para registrar erros do app
CREATE TABLE public.app_error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  error_message text NOT NULL,
  error_stack text,
  error_context text,
  page_url text,
  platform text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_error_logs ENABLE ROW LEVEL SECURITY;

-- Qualquer usuário autenticado pode inserir seus próprios logs
CREATE POLICY "Users can insert their own error logs"
ON public.app_error_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Admins podem ver todos os logs
CREATE POLICY "Admins can view all error logs"
ON public.app_error_logs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Usuários podem ver seus próprios logs
CREATE POLICY "Users can view their own error logs"
ON public.app_error_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Permitir insert anônimo (para erros antes do login)
CREATE POLICY "Anyone can insert error logs"
ON public.app_error_logs
FOR INSERT
TO anon
WITH CHECK (user_id IS NULL);

-- Index para consultas por data e usuário
CREATE INDEX idx_error_logs_created_at ON public.app_error_logs(created_at DESC);
CREATE INDEX idx_error_logs_user_id ON public.app_error_logs(user_id);
