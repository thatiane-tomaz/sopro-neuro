
CREATE TABLE public.mural_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  author_name TEXT,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 600),
  day_number INT,
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending','approved','rejected')),
  color_hue INT NOT NULL DEFAULT 220,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX mural_posts_status_created_idx ON public.mural_posts (status, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mural_posts TO authenticated;
GRANT ALL ON public.mural_posts TO service_role;

ALTER TABLE public.mural_posts ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read approved posts
CREATE POLICY "Read approved posts"
ON public.mural_posts FOR SELECT TO authenticated
USING (status = 'approved' OR user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Users can insert their own posts (auto approved for MVP; can moderate later)
CREATE POLICY "Users insert own posts"
ON public.mural_posts FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can delete their own posts
CREATE POLICY "Users delete own posts"
ON public.mural_posts FOR DELETE TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Admins can update (moderate)
CREATE POLICY "Admins update posts"
ON public.mural_posts FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
