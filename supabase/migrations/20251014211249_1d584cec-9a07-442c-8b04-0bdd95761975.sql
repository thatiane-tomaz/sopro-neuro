-- Add welcome_title field to daily_content table for personalized page titles by day
ALTER TABLE public.daily_content
ADD COLUMN welcome_title text;

-- Add optional welcome_subtitle for additional context
ALTER TABLE public.daily_content
ADD COLUMN welcome_subtitle text;

-- Add some default values for the first few days as examples
UPDATE public.daily_content
SET welcome_title = 'Bem-vindo ao Dia 1!',
    welcome_subtitle = 'Sua jornada para uma vida sem cigarro começa hoje'
WHERE day_number = 1;

UPDATE public.daily_content
SET welcome_title = 'Continue a sua jornada!',
    welcome_subtitle = 'Dia 2 - Você está no caminho certo'
WHERE day_number = 2;

UPDATE public.daily_content
SET welcome_title = 'Continue a sua jornada!',
    welcome_subtitle = 'Mantenha o foco e a determinação'
WHERE day_number >= 3;