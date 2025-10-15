-- Update phase 2 title to remove "durante a abstinência"
UPDATE public.phases
SET title = 'Técnicas Respiratórias'
WHERE phase_number = 2;

-- Update phase 3 title to "Transformando Crenças"
UPDATE public.phases
SET title = 'Transformando Crenças'
WHERE phase_number = 3;