ALTER TABLE public.mural_posts ADD COLUMN IF NOT EXISTS habito_titulo TEXT;
CREATE INDEX IF NOT EXISTS mural_posts_habito_titulo_idx ON public.mural_posts (habito_titulo);