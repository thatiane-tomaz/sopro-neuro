-- Remove duplicates of "Momento de pausa no trabalho", keeping only the first one created
WITH duplicates AS (
  SELECT id, 
         ROW_NUMBER() OVER (PARTITION BY title ORDER BY created_at) as row_num
  FROM public.triggers_content
  WHERE title = 'Momento de pausa no trabalho'
)
DELETE FROM public.triggers_content
WHERE id IN (
  SELECT id FROM duplicates WHERE row_num > 1
);