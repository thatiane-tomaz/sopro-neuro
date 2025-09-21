-- Criar tabela para textos organizados por dia do processo
CREATE TABLE public.daily_texts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  day_number INTEGER NOT NULL,
  text_key TEXT NOT NULL,
  text_content TEXT NOT NULL,
  text_type TEXT NOT NULL, -- 'title', 'subtitle', 'description', 'phase_description', 'completion_message', etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(day_number, text_key)
);

-- Enable RLS
ALTER TABLE public.daily_texts ENABLE ROW LEVEL SECURITY;

-- Create policies for content management
CREATE POLICY "Admins can manage daily texts" 
ON public.daily_texts 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Daily texts are viewable by everyone" 
ON public.daily_texts 
FOR SELECT 
USING (true);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_daily_texts_updated_at
BEFORE UPDATE ON public.daily_texts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir dados exemplo para os primeiros dias
INSERT INTO public.daily_texts (day_number, text_key, text_content, text_type) VALUES
-- Dia 0 (onboarding)
(0, 'hero_title', 'Transforme sua vida e pare de fumar definitivamente', 'title'),
(0, 'hero_subtitle', 'Usando métodos cientificamente comprovados', 'subtitle'),
(0, 'onboarding_question1_title', 'Vamos nos conhecer melhor', 'title'),
(0, 'onboarding_question2_title', 'Com que frequência você fuma atualmente?', 'title'),

-- Dia 1
(1, 'phase_title', 'Quebrando Crenças e Aprendendo', 'title'),
(1, 'phase_subtitle', 'Continue fumando enquanto aprende', 'subtitle'),
(1, 'phase_description', 'Nesta fase você vai descobrir como a nicotina age no seu corpo e mente, quebrando falsas crenças sobre o cigarro.', 'description'),
(1, 'daily_conquest_title', 'Sua Conquista de Hoje', 'title'),
(1, 'daily_conquest_description', 'Hoje você vai começar a entender a neurociência do vício e relaxar com uma primeira hipnose de conscientização.', 'description'),
(1, 'video_title', 'Neurociência do Vício', 'title'),
(1, 'hypnosis_title', 'Desconstruindo Mitos', 'title'),
(1, 'completion_message', '🎉 Parabéns, você completou a conquista de Hoje', 'completion_message'),

-- Dia 2
(2, 'phase_title', 'Quebrando Crenças e Aprendendo', 'title'),
(2, 'phase_subtitle', 'Continue fumando enquanto aprende', 'subtitle'),
(2, 'phase_description', 'Hoje você vai aprofundar seu conhecimento sobre como o cigarro afeta seu cérebro e explorar novas perspectivas.', 'description'),
(2, 'daily_conquest_title', 'Sua Conquista de Hoje', 'title'),
(2, 'daily_conquest_description', 'Segundo dia de descobertas sobre neurociência e uma hipnose para fortalecer sua motivação.', 'description'),
(2, 'completion_message', '🎉 Parabéns, você completou a conquista de Hoje', 'completion_message'),

-- Dia 3
(3, 'phase_title', 'Quebrando Crenças e Aprendendo', 'title'),
(3, 'phase_subtitle', 'Continue fumando enquanto aprende', 'subtitle'),
(3, 'phase_description', 'Hoje você vai aprofundar seu conhecimento sobre neurociência e relaxar com uma hipnose de desconstrução de mitos.', 'description'),
(3, 'daily_conquest_title', 'Sua Conquista de Hoje', 'title'),
(3, 'daily_conquest_description', 'Atividades do dia para sua transformação', 'description'),
(3, 'completion_message', '🎉 Parabéns, você completou a conquista de Hoje', 'completion_message'),

-- Textos gerais do sistema
(0, 'free_trial_message', 'Você tem 2 dias liberados para experimentar. Aproveite cada momento!', 'system_message'),
(0, 'upgrade_card_title', 'Acesso Premium', 'title'),
(0, 'upgrade_card_description', 'Desbloqueie todo o programa de transformação', 'description'),
(0, 'methods_neurosciencia_title', 'Neurociência', 'title'),
(0, 'methods_neurosciencia_description', 'Baseado em pesquisas sobre como o cérebro funciona e como mudar padrões de comportamento definitivamente.', 'description'),
(0, 'methods_hipnose_title', 'Hipnose Clínica', 'title'),
(0, 'methods_hipnose_description', 'Técnicas de hipnose terapêutica para acessar o subconsciente e reprogramar comportamentos automáticos.', 'description'),
(0, 'methods_educacao_title', 'Educação Personalizada', 'title'),
(0, 'methods_educacao_description', 'Conteúdo educativo adaptado ao seu perfil, necessidades e momento na jornada de transformação.', 'description');