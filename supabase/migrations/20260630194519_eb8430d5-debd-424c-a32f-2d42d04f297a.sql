ALTER TABLE public.habitos_jornada
  ADD COLUMN IF NOT EXISTS video boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS hipnose boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS missao boolean NOT NULL DEFAULT true;