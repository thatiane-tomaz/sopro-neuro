
CREATE TABLE public.user_progress_summary (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  email text,
  max_unlocked_day integer NOT NULL DEFAULT 1,
  last_app_access timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_user_progress_summary_user_id ON public.user_progress_summary (user_id);

ALTER TABLE public.user_progress_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own progress summary"
ON public.user_progress_summary FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress summary"
ON public.user_progress_summary FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress summary"
ON public.user_progress_summary FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all progress summaries"
ON public.user_progress_summary FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_user_progress_summary_updated_at
BEFORE UPDATE ON public.user_progress_summary
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para atualizar automaticamente quando o usuário abre o app
CREATE OR REPLACE FUNCTION public.upsert_user_progress_on_session()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_email text;
  v_max_day integer;
BEGIN
  -- Buscar email do perfil
  SELECT email INTO v_email FROM profiles WHERE user_id = NEW.user_id LIMIT 1;

  -- Calcular dia máximo completado + 1 (próximo dia liberado)
  SELECT COALESCE(MAX(
    CASE 
      WHEN interaction_type LIKE 'video_dia_%' 
        AND progress_percentage >= 98 
        AND finished_at IS NOT NULL 
      THEN CAST(REPLACE(interaction_type, 'video_dia_', '') AS integer)
      ELSE 0
    END
  ), 0) + 1 INTO v_max_day
  FROM journey_tracking
  WHERE user_id = NEW.user_id;

  -- Limitar a 21
  IF v_max_day > 21 THEN
    v_max_day := 21;
  END IF;

  -- Upsert
  INSERT INTO user_progress_summary (user_id, email, max_unlocked_day, last_app_access)
  VALUES (NEW.user_id, v_email, v_max_day, NOW())
  ON CONFLICT (user_id) 
  DO UPDATE SET
    email = EXCLUDED.email,
    max_unlocked_day = EXCLUDED.max_unlocked_day,
    last_app_access = NOW(),
    updated_at = NOW();

  RETURN NEW;
END;
$$;

-- Trigger: atualiza quando usuário abre o app (insere sessão)
CREATE TRIGGER update_progress_on_app_session
AFTER INSERT ON public.app_sessions
FOR EACH ROW
EXECUTE FUNCTION public.upsert_user_progress_on_session();
