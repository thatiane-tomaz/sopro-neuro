CREATE TABLE public.ultima_jornada_usuario (
  user_id uuid PRIMARY KEY,
  jornada text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.ultima_jornada_usuario TO authenticated;
GRANT ALL ON public.ultima_jornada_usuario TO service_role;
ALTER TABLE public.ultima_jornada_usuario ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.ultima_jornada_usuario FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.ultima_jornada_usuario FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND jornada IN ('reducao','abstinencia'));
CREATE POLICY "own update" ON public.ultima_jornada_usuario FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND jornada IN ('reducao','abstinencia'));
CREATE TRIGGER update_ultima_jornada_updated_at BEFORE UPDATE ON public.ultima_jornada_usuario FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();