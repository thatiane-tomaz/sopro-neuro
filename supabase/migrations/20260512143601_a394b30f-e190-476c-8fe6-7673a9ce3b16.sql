
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS start_here_seen boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.mark_start_here_seen()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.profiles SET start_here_seen = true, updated_at = now() WHERE user_id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.mark_start_here_seen() TO authenticated;
