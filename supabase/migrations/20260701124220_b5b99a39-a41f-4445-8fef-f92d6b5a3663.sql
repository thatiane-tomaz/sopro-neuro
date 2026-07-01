
-- 1) onboarding_responses_v2
CREATE TABLE public.onboarding_responses_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text,
  respostas jsonb NOT NULL DEFAULT '{}'::jsonb,
  jornada_inicial text NOT NULL CHECK (jornada_inicial IN ('reducao','abstinencia')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.onboarding_responses_v2 TO authenticated;
GRANT ALL ON public.onboarding_responses_v2 TO service_role;

ALTER TABLE public.onboarding_responses_v2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own onboarding v2"
  ON public.onboarding_responses_v2 FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding v2"
  ON public.onboarding_responses_v2 FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding v2"
  ON public.onboarding_responses_v2 FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all onboarding v2"
  ON public.onboarding_responses_v2 FOR SELECT
  TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER onboarding_responses_v2_updated_at
  BEFORE UPDATE ON public.onboarding_responses_v2
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_onboarding_v2_user ON public.onboarding_responses_v2(user_id);

-- 2) historico_jornada_usuario
CREATE TABLE public.historico_jornada_usuario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  jornada text NOT NULL CHECK (jornada IN ('reducao','abstinencia')),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.historico_jornada_usuario TO authenticated;
GRANT ALL ON public.historico_jornada_usuario TO service_role;

ALTER TABLE public.historico_jornada_usuario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own journey history"
  ON public.historico_jornada_usuario FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journey history"
  ON public.historico_jornada_usuario FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all journey history"
  ON public.historico_jornada_usuario FOR SELECT
  TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_hist_jornada_user_created ON public.historico_jornada_usuario(user_id, created_at DESC);
