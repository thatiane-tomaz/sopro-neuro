-- Criar tabela para as fases
CREATE TABLE public.phases (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phase_number integer NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Criar tabela para os dias
CREATE TABLE public.daily_content (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  day_number integer NOT NULL UNIQUE,
  title text NOT NULL,
  video_minutes integer,
  hypnosis_minutes integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_content ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - todos podem visualizar
CREATE POLICY "Phases are viewable by everyone"
ON public.phases
FOR SELECT
USING (true);

CREATE POLICY "Daily content is viewable by everyone"
ON public.daily_content
FOR SELECT
USING (true);

-- Políticas RLS - apenas admins podem gerenciar
CREATE POLICY "Admins can manage phases"
ON public.phases
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage daily content"
ON public.daily_content
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_phases_updated_at
BEFORE UPDATE ON public.phases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_content_updated_at
BEFORE UPDATE ON public.daily_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir dados iniciais das 3 fases
INSERT INTO public.phases (phase_number, title, subtitle) VALUES
  (1, 'Fase 1', 'Despertar Interior'),
  (2, 'Fase 2', 'Transformação Profunda'),
  (3, 'Fase 3', 'Integração e Renovação');

-- Inserir dados iniciais dos 21 dias
INSERT INTO public.daily_content (day_number, title, video_minutes, hypnosis_minutes) VALUES
  (1, 'Dia 1', 10, 15),
  (2, 'Dia 2', 10, 15),
  (3, 'Dia 3', 10, 15),
  (4, 'Dia 4', 10, 15),
  (5, 'Dia 5', 10, 15),
  (6, 'Dia 6', 10, 15),
  (7, 'Dia 7', 10, 15),
  (8, 'Dia 8', 10, 15),
  (9, 'Dia 9', 10, 15),
  (10, 'Dia 10', 10, 15),
  (11, 'Dia 11', 10, 15),
  (12, 'Dia 12', 10, 15),
  (13, 'Dia 13', 10, 15),
  (14, 'Dia 14', 10, 15),
  (15, 'Dia 15', 10, 15),
  (16, 'Dia 16', 10, 15),
  (17, 'Dia 17', 10, 15),
  (18, 'Dia 18', 10, 15),
  (19, 'Dia 19', 10, 15),
  (20, 'Dia 20', 10, 15),
  (21, 'Dia 21', 10, 15);