CREATE TABLE public.neo_explica (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo text NOT NULL,
  pasta text NOT NULL,
  jornada text,
  ordem integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  segundos_por_imagem integer NOT NULL DEFAULT 7,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.neo_explica TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.neo_explica TO authenticated;
GRANT ALL ON public.neo_explica TO service_role;
ALTER TABLE public.neo_explica ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read active neo_explica" ON public.neo_explica
  FOR SELECT TO authenticated USING (ativo OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage neo_explica" ON public.neo_explica
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER neo_explica_updated_at BEFORE UPDATE ON public.neo_explica
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.neo_explica_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  explica_id uuid NOT NULL REFERENCES public.neo_explica(id) ON DELETE CASCADE,
  aberto_em timestamptz NOT NULL DEFAULT now(),
  concluido_em timestamptz
);
CREATE INDEX neo_explica_views_user_idx ON public.neo_explica_views (user_id, aberto_em DESC);
GRANT SELECT, INSERT, UPDATE ON public.neo_explica_views TO authenticated;
GRANT ALL ON public.neo_explica_views TO service_role;
ALTER TABLE public.neo_explica_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own neo_explica_views" ON public.neo_explica_views
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own neo_explica_views" ON public.neo_explica_views
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own neo_explica_views" ON public.neo_explica_views
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.neo_explica_estado (
  user_id uuid NOT NULL PRIMARY KEY,
  explica_id uuid REFERENCES public.neo_explica(id) ON DELETE SET NULL,
  exibido_em timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.neo_explica_estado TO authenticated;
GRANT ALL ON public.neo_explica_estado TO service_role;
ALTER TABLE public.neo_explica_estado ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own neo_explica_estado" ON public.neo_explica_estado
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own neo_explica_estado" ON public.neo_explica_estado
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own neo_explica_estado" ON public.neo_explica_estado
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER neo_explica_estado_updated_at BEFORE UPDATE ON public.neo_explica_estado
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Authenticated can read neo-explica" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'neo-explica');
CREATE POLICY "Admins can upload neo-explica" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'neo-explica' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update neo-explica" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'neo-explica' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete neo-explica" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'neo-explica' AND public.has_role(auth.uid(), 'admin'));