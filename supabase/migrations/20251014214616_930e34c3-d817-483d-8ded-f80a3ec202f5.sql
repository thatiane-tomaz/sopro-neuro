-- Update triggers content with corrected titles
UPDATE public.triggers_content SET
  title = 'Festas e encontros',
  description = 'Escute antes de ir a um local onde haverá outros fumantes'
WHERE title = 'Festas e Encontros';

UPDATE public.triggers_content SET
  title = 'Ao voltar do trabalho',
  description = 'O que fazer em um momento que costumava fumar'
WHERE title = 'Ao voltar do Trabalho';

UPDATE public.triggers_content SET
  title = 'Momento estressante',
  description = 'O que fazer quando algo estressante acontecer'
WHERE title = 'Momento Estressante';

UPDATE public.triggers_content SET
  title = 'Encontrar um fumante',
  description = 'Escute antes de encontrar com uma pessoa com quem costumava fumar'
WHERE title = 'Encontrar um fumante';

-- Update the existing "Momento de pausa" to "Momento de pausa em casa"
UPDATE public.triggers_content SET
  title = 'Momento de pausa em casa',
  description = 'Como continuar tendo os momentos de pausa em casa',
  file_name = 'gatilho_pausa_casa.mp3'
WHERE title = 'Momento de pausa';

-- Add new "Momento de pausa no trabalho"
INSERT INTO public.triggers_content (title, description, file_name, duration_minutes, display_order)
VALUES ('Momento de pausa no trabalho', 'Como continuar tendo os momentos de pausa no trabalho', 'gatilho_pausa_trabalho.mp3', 7, 6);