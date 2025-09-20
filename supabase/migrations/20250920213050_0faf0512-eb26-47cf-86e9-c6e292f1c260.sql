-- Create content table for videos and hypnosis sessions
CREATE TABLE public.content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    content_type TEXT NOT NULL CHECK (content_type IN ('video', 'hypnosis')),
    week_number INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 3),
    day_number INTEGER NOT NULL CHECK (day_number >= 1 AND day_number <= 7),
    duration_minutes INTEGER,
    file_url TEXT, -- For external URLs or storage paths
    thumbnail_url TEXT,
    is_premium BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(content_type, week_number, day_number)
);

-- Enable RLS
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;

-- Create policies for content access
CREATE POLICY "Content is viewable by everyone"
ON public.content
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage content"
ON public.content
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create storage buckets for content files
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('videos', 'videos', true),
  ('hypnosis', 'hypnosis', true);

-- Storage policies for videos bucket
CREATE POLICY "Videos are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'videos');

CREATE POLICY "Admins can upload videos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'videos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update videos"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'videos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete videos"
ON storage.objects
FOR DELETE
USING (bucket_id = 'videos' AND public.has_role(auth.uid(), 'admin'));

-- Storage policies for hypnosis bucket
CREATE POLICY "Hypnosis files are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'hypnosis');

CREATE POLICY "Admins can upload hypnosis files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'hypnosis' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update hypnosis files"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'hypnosis' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete hypnosis files"
ON storage.objects
FOR DELETE
USING (bucket_id = 'hypnosis' AND public.has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_content_updated_at
BEFORE UPDATE ON public.content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample content for testing
INSERT INTO public.content (title, description, content_type, week_number, day_number, duration_minutes, file_url, is_premium) VALUES
  ('Neurociência do Vício', 'Entenda como a nicotina age no seu cérebro e corpo', 'video', 1, 1, 5, 'https://example.com/video1.mp4', false),
  ('Desconstruindo Mitos', 'Hipnose para quebrar falsas crenças sobre o cigarro', 'hypnosis', 1, 1, 10, 'https://example.com/hypnosis1.mp3', false),
  ('O Primeiro Passo', 'Preparação mental para a jornada', 'video', 1, 2, 4, 'https://example.com/video2.mp4', false),
  ('Relaxamento Inicial', 'Técnicas de relaxamento para começar', 'hypnosis', 1, 2, 8, 'https://example.com/hypnosis2.mp3', false),
  ('Preparação Mental Avançada', 'Conteúdo premium para o dia 3', 'video', 1, 3, 6, 'https://example.com/video3.mp4', true),
  ('Hipnose Profunda', 'Sessão premium de hipnose avançada', 'hypnosis', 1, 3, 12, 'https://example.com/hypnosis3.mp3', true);