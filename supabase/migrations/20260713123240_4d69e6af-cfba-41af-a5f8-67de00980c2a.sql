
-- 1. Config: sparks por evento
CREATE TABLE public.brain_sparks_config (
  event_key text PRIMARY KEY,
  sparks_value integer NOT NULL,
  description text,
  once_per_day boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.brain_sparks_config TO anon, authenticated;
GRANT ALL ON public.brain_sparks_config TO service_role;
ALTER TABLE public.brain_sparks_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sparks config readable by anyone" ON public.brain_sparks_config FOR SELECT USING (true);

INSERT INTO public.brain_sparks_config (event_key, sparks_value, description, once_per_day) VALUES
  ('video_completed', 5, 'Assistir vídeo até o fim', false),
  ('hypnosis_completed', 5, 'Concluir hipnose', false),
  ('mission_completed', 5, 'Concluir missão', false),
  ('mission_completed_with_mural_post', 10, 'Concluir missão e postar no mural', false),
  ('chat_message', 10, 'Conversar com IA (1x/dia)', true),
  ('mural_post', 10, 'Publicar no mural', false),
  ('mural_comment', 10, 'Comentar no mural', false),
  ('login_streak_2', 10, 'Login 2 dias seguidos', false),
  ('login_streak_5', 20, 'Login 5 dias seguidos', false),
  ('sos_used', 10, 'Usar SOS (1x/dia)', true);

-- 2. Config: níveis
CREATE TABLE public.brain_levels_config (
  level integer PRIMARY KEY,
  min_sparks integer NOT NULL,
  max_sparks integer,
  label text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.brain_levels_config TO anon, authenticated;
GRANT ALL ON public.brain_levels_config TO service_role;
ALTER TABLE public.brain_levels_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Levels config readable by anyone" ON public.brain_levels_config FOR SELECT USING (true);

INSERT INTO public.brain_levels_config (level, min_sparks, max_sparks, label) VALUES
  (1, 0, 25, 'Nível 1'),
  (2, 26, 50, 'Nível 2'),
  (3, 51, 75, 'Nível 3'),
  (4, 76, 100, 'Nível 4'),
  (5, 101, NULL, 'Nível 5');

-- 3. Log de sparks
CREATE TABLE public.brain_sparks_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_key text NOT NULL,
  sparks_awarded integer NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_brain_sparks_log_user_event_date ON public.brain_sparks_log (user_id, event_key, created_at DESC);
GRANT SELECT ON public.brain_sparks_log TO authenticated;
GRANT ALL ON public.brain_sparks_log TO service_role;
ALTER TABLE public.brain_sparks_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own sparks log" ON public.brain_sparks_log FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 4. Colunas no profile
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS brain_sparks integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS brain_last_active_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS brain_last_login_date date,
  ADD COLUMN IF NOT EXISTS brain_login_streak integer NOT NULL DEFAULT 0;

-- 5. Função award_sparks
CREATE OR REPLACE FUNCTION public.award_sparks(
  p_event_key text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_cfg record;
  v_new_total integer;
  v_level integer;
  v_already_today boolean;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT * INTO v_cfg FROM public.brain_sparks_config WHERE event_key = p_event_key;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'unknown_event_key: %', p_event_key;
  END IF;

  -- Deduplicação diária
  IF v_cfg.once_per_day THEN
    SELECT EXISTS(
      SELECT 1 FROM public.brain_sparks_log
      WHERE user_id = v_user_id
        AND event_key = p_event_key
        AND created_at >= date_trunc('day', now())
    ) INTO v_already_today;
    IF v_already_today THEN
      SELECT brain_sparks INTO v_new_total FROM public.profiles WHERE user_id = v_user_id;
      SELECT level INTO v_level FROM public.brain_levels_config
        WHERE min_sparks <= v_new_total AND (max_sparks IS NULL OR max_sparks >= v_new_total)
        ORDER BY level DESC LIMIT 1;
      RETURN jsonb_build_object('sparks_awarded', 0, 'total_sparks', v_new_total, 'level', v_level, 'deduped', true);
    END IF;
  END IF;

  INSERT INTO public.brain_sparks_log (user_id, event_key, sparks_awarded, metadata)
  VALUES (v_user_id, p_event_key, v_cfg.sparks_value, COALESCE(p_metadata, '{}'::jsonb));

  UPDATE public.profiles
  SET brain_sparks = brain_sparks + v_cfg.sparks_value,
      brain_last_active_at = now(),
      updated_at = now()
  WHERE user_id = v_user_id
  RETURNING brain_sparks INTO v_new_total;

  SELECT level INTO v_level FROM public.brain_levels_config
    WHERE min_sparks <= v_new_total AND (max_sparks IS NULL OR max_sparks >= v_new_total)
    ORDER BY level DESC LIMIT 1;

  RETURN jsonb_build_object('sparks_awarded', v_cfg.sparks_value, 'total_sparks', v_new_total, 'level', v_level, 'deduped', false);
END;
$$;
GRANT EXECUTE ON FUNCTION public.award_sparks(text, jsonb) TO authenticated;

-- 6. Função register_login_and_award
CREATE OR REPLACE FUNCTION public.register_login_and_award()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_today date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_last date;
  v_streak integer;
  v_awarded jsonb := '[]'::jsonb;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT brain_last_login_date, brain_login_streak INTO v_last, v_streak
  FROM public.profiles WHERE user_id = v_user_id;

  IF v_last = v_today THEN
    RETURN jsonb_build_object('streak', v_streak, 'awarded', v_awarded, 'noop', true);
  END IF;

  IF v_last IS NULL OR v_last < v_today - 1 THEN
    v_streak := 1;
  ELSE
    v_streak := COALESCE(v_streak, 0) + 1;
  END IF;

  UPDATE public.profiles
  SET brain_last_login_date = v_today,
      brain_login_streak = v_streak,
      brain_last_active_at = now(),
      updated_at = now()
  WHERE user_id = v_user_id;

  IF v_streak = 5 OR (v_streak > 5 AND v_streak % 5 = 0) THEN
    v_awarded := v_awarded || to_jsonb(public.award_sparks('login_streak_5', jsonb_build_object('streak', v_streak)));
  ELSIF v_streak = 2 THEN
    v_awarded := v_awarded || to_jsonb(public.award_sparks('login_streak_2', jsonb_build_object('streak', v_streak)));
  END IF;

  RETURN jsonb_build_object('streak', v_streak, 'awarded', v_awarded, 'noop', false);
END;
$$;
GRANT EXECUTE ON FUNCTION public.register_login_and_award() TO authenticated;
