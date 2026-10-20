CREATE TABLE public.free_content_claims (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  kind text NOT NULL,
  content_identifier text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, kind)
);

GRANT SELECT, INSERT ON public.free_content_claims TO authenticated;
GRANT ALL ON public.free_content_claims TO service_role;

ALTER TABLE public.free_content_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own free claims"
ON public.free_content_claims FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own free claims"
ON public.free_content_claims FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND kind IN ('hipnose', 'neo', 'explicacao'));

CREATE POLICY "Admins can view all free claims"
ON public.free_content_claims FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));