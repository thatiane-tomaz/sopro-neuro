
-- 1. Update the auto-complete trigger to fire at 85% instead of 95%
CREATE OR REPLACE FUNCTION public.auto_complete_high_progress()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  -- If progress reached 85% or more and no finished_at yet, mark as completed
  IF NEW.progress_percentage >= 85 AND NEW.finished_at IS NULL THEN
    NEW.finished_at = NOW();
  END IF;
  RETURN NEW;
END;
$function$;

-- 2. Fix existing stuck records (progress >= 85% but not finished)
UPDATE journey_tracking 
SET finished_at = NOW()
WHERE progress_percentage >= 85 
  AND finished_at IS NULL;

-- 3. Also update the is_day_completed function to use 85% threshold
CREATE OR REPLACE FUNCTION public.is_day_completed(p_user_id uuid, p_day integer)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.journey_tracking
    WHERE user_id = p_user_id
      AND interaction_type = 'video_dia_' || p_day
      AND progress_percentage >= 85
      AND finished_at IS NOT NULL
  ) AND EXISTS (
    SELECT 1 FROM public.journey_tracking
    WHERE user_id = p_user_id
      AND interaction_type = 'hipnose_dia_' || p_day
      AND progress_percentage >= 85
      AND finished_at IS NOT NULL
  );
$function$;

-- 4. Update get_day_completion_time to match
CREATE OR REPLACE FUNCTION public.get_day_completion_time(p_user_id uuid, p_day integer)
 RETURNS timestamp with time zone
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT MAX(finished_at)
  FROM public.journey_tracking
  WHERE user_id = p_user_id
    AND interaction_type IN ('video_dia_' || p_day, 'hipnose_dia_' || p_day)
    AND progress_percentage >= 85
    AND finished_at IS NOT NULL;
$function$;
