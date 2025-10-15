-- Remove subtitle from Phase 2
UPDATE public.phases 
SET subtitle = '' 
WHERE phase_number = 2;