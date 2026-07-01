
ALTER TABLE public.habitos_jornada ADD COLUMN IF NOT EXISTS objetivo_chat_missao TEXT;

DO $$ BEGIN
  CREATE TYPE public.missao_performance AS ENUM (
    'Quebrou o hábito',
    'Enfraqueceu o hábito',
    'Melhorou consciência sobre o hábito',
    'Não teve impacto positivo'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.resultado_missao_usuario (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  habito_id UUID NOT NULL REFERENCES public.habitos_jornada(id) ON DELETE CASCADE,
  performance public.missao_performance,
  resumo_mural TEXT,
  consentiu_postar BOOLEAN NOT NULL DEFAULT false,
  postado_no_mural BOOLEAN NOT NULL DEFAULT false,
  transcript JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.resultado_missao_usuario TO authenticated;
GRANT ALL ON public.resultado_missao_usuario TO service_role;

ALTER TABLE public.resultado_missao_usuario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mission results"
  ON public.resultado_missao_usuario FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mission results"
  ON public.resultado_missao_usuario FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mission results"
  ON public.resultado_missao_usuario FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all mission results"
  ON public.resultado_missao_usuario FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_resultado_missao_usuario_updated_at
  BEFORE UPDATE ON public.resultado_missao_usuario
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_resultado_missao_user ON public.resultado_missao_usuario(user_id);
CREATE INDEX IF NOT EXISTS idx_resultado_missao_habito ON public.resultado_missao_usuario(habito_id);
