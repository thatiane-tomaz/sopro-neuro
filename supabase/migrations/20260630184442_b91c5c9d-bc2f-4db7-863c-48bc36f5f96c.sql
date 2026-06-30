CREATE TABLE public.gatilhos_jornada (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gatilho TEXT NOT NULL,
  titulo_gatilho TEXT NOT NULL,
  explicacao_desafio TEXT NOT NULL,
  posicao INTEGER NOT NULL,
  tipo_usuario TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.gatilhos_jornada TO authenticated;
GRANT ALL ON public.gatilhos_jornada TO service_role;

ALTER TABLE public.gatilhos_jornada ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view gatilhos"
  ON public.gatilhos_jornada FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage gatilhos"
  ON public.gatilhos_jornada FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_gatilhos_jornada_updated_at
  BEFORE UPDATE ON public.gatilhos_jornada
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
