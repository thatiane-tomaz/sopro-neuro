ALTER TABLE public.habitos_jornada
  ALTER COLUMN titulo_gatilho DROP NOT NULL,
  ALTER COLUMN explicacao_desafio DROP NOT NULL,
  ALTER COLUMN tipo_usuario DROP NOT NULL;