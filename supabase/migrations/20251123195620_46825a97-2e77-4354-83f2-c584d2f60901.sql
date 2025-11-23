-- Create support_content table for hypnosis support content
CREATE TABLE public.support_content (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  file_name text NOT NULL,
  duration_minutes integer,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_content ENABLE ROW LEVEL SECURITY;

-- Create policies for support_content
CREATE POLICY "Support content is viewable by everyone"
ON public.support_content
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage support content"
ON public.support_content
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_support_content_updated_at
BEFORE UPDATE ON public.support_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();