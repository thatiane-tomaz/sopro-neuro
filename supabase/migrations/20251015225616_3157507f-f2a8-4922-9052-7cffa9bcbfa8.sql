-- Update phase 1 title to "Transformando Crenças"
UPDATE public.phases
SET title = 'Transformando Crenças'
WHERE phase_number = 1;

-- Delete phase 3 if it exists (project only has 2 phases)
DELETE FROM public.phases
WHERE phase_number = 3;