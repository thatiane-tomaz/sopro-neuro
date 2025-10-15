-- Delete daily content for days 15-21 (Phase 3)
DELETE FROM public.daily_content 
WHERE day_number BETWEEN 15 AND 21;

-- Delete Phase 3
DELETE FROM public.phases 
WHERE phase_number = 3;