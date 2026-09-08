ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS push_last_kind text,
  ADD COLUMN IF NOT EXISTS push_last_rotativa_id uuid;