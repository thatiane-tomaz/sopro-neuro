-- Create triggers_content table
CREATE TABLE public.triggers_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  file_name TEXT NOT NULL,
  duration_minutes INTEGER,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.triggers_content ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view active triggers
CREATE POLICY "Triggers content is viewable by everyone"
ON public.triggers_content
FOR SELECT
USING (is_active = true);

-- Allow admins to manage triggers content
CREATE POLICY "Admins can manage triggers content"
ON public.triggers_content
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_triggers_content_updated_at
BEFORE UPDATE ON public.triggers_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial triggers content
INSERT INTO public.triggers_content (title, description, file_name, duration_minutes, display_order) VALUES
('Festas e Encontros', 'Escute antes de ir a um local onde haverá outros fumantes', 'gatilho_festas.mp3', 8, 1),
('Ao voltar do Trabalho', 'O que fazer em um momento que costumava fumar', 'gatilho_trabalho.mp3', 6, 2),
('Momento Estressante', 'O que fazer quando algo estressante acontecer', 'gatilho_estresse.mp3', 10, 3),
('Encontrar um fumante', 'Escute antes de encontrar com uma pessoa com quem costumava fumar', 'gatilho_fumante.mp3', 9, 4),
('Momento de pausa', 'Como continuar tendo os momentos de pausa', 'gatilho_pausa.mp3', 7, 5);