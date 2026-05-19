
ALTER TABLE public.user_progress_summary
  ADD COLUMN IF NOT EXISTS last_completed_type text,
  ADD COLUMN IF NOT EXISTS last_completed_day integer,
  ADD COLUMN IF NOT EXISTS last_completed_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS last_completed_label text;

-- Recreate trigger function to also populate last completed info
CREATE OR REPLACE FUNCTION public.upsert_user_progress_on_session()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_email text;
  v_max_day integer;
  v_last_type text;
  v_last_day integer;
  v_last_at timestamptz;
  v_last_label text;
BEGIN
  SELECT email INTO v_email FROM profiles WHERE user_id = NEW.user_id LIMIT 1;

  SELECT COALESCE(MAX(
    CASE 
      WHEN interaction_type LIKE 'video_dia_%' 
        AND progress_percentage >= 98 
        AND finished_at IS NOT NULL 
      THEN CAST(REPLACE(interaction_type, 'video_dia_', '') AS integer)
      ELSE 0
    END
  ), 0) + 1 INTO v_max_day
  FROM journey_tracking
  WHERE user_id = NEW.user_id;

  IF v_max_day > 21 THEN
    v_max_day := 21;
  END IF;

  -- Get last completed content (video or hypnosis)
  SELECT
    CASE WHEN interaction_type LIKE 'video_dia_%' THEN 'video' ELSE 'hipnose' END,
    CASE 
      WHEN interaction_type LIKE 'video_dia_%' THEN CAST(REPLACE(interaction_type, 'video_dia_', '') AS integer)
      WHEN interaction_type LIKE 'hipnose_dia_%' THEN CAST(REPLACE(interaction_type, 'hipnose_dia_', '') AS integer)
    END,
    finished_at,
    CASE 
      WHEN interaction_type LIKE 'video_dia_%' THEN 'Vídeo Dia ' || REPLACE(interaction_type, 'video_dia_', '')
      WHEN interaction_type LIKE 'hipnose_dia_%' THEN 'Hipnose Dia ' || REPLACE(interaction_type, 'hipnose_dia_', '')
    END
  INTO v_last_type, v_last_day, v_last_at, v_last_label
  FROM journey_tracking
  WHERE user_id = NEW.user_id
    AND finished_at IS NOT NULL
    AND (interaction_type LIKE 'video_dia_%' OR interaction_type LIKE 'hipnose_dia_%')
  ORDER BY finished_at DESC
  LIMIT 1;

  INSERT INTO user_progress_summary (
    user_id, email, max_unlocked_day, last_app_access,
    last_completed_type, last_completed_day, last_completed_at, last_completed_label
  )
  VALUES (
    NEW.user_id, v_email, v_max_day, NOW(),
    v_last_type, v_last_day, v_last_at, v_last_label
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    email = EXCLUDED.email,
    max_unlocked_day = EXCLUDED.max_unlocked_day,
    last_app_access = NOW(),
    last_completed_type = EXCLUDED.last_completed_type,
    last_completed_day = EXCLUDED.last_completed_day,
    last_completed_at = EXCLUDED.last_completed_at,
    last_completed_label = EXCLUDED.last_completed_label,
    updated_at = NOW();

  RETURN NEW;
END;
$function$;

-- Also trigger update when journey_tracking changes (so last completed updates after finishing content)
DROP TRIGGER IF EXISTS update_progress_summary_on_journey ON public.journey_tracking;
CREATE TRIGGER update_progress_summary_on_journey
AFTER INSERT OR UPDATE ON public.journey_tracking
FOR EACH ROW
EXECUTE FUNCTION public.upsert_user_progress_on_session();

-- Backfill existing rows
WITH last_completed AS (
  SELECT DISTINCT ON (user_id)
    user_id,
    CASE WHEN interaction_type LIKE 'video_dia_%' THEN 'video' ELSE 'hipnose' END AS ltype,
    CASE 
      WHEN interaction_type LIKE 'video_dia_%' THEN CAST(REPLACE(interaction_type, 'video_dia_', '') AS integer)
      WHEN interaction_type LIKE 'hipnose_dia_%' THEN CAST(REPLACE(interaction_type, 'hipnose_dia_', '') AS integer)
    END AS lday,
    finished_at AS lat,
    CASE 
      WHEN interaction_type LIKE 'video_dia_%' THEN 'Vídeo Dia ' || REPLACE(interaction_type, 'video_dia_', '')
      WHEN interaction_type LIKE 'hipnose_dia_%' THEN 'Hipnose Dia ' || REPLACE(interaction_type, 'hipnose_dia_', '')
    END AS llabel
  FROM journey_tracking
  WHERE finished_at IS NOT NULL
    AND (interaction_type LIKE 'video_dia_%' OR interaction_type LIKE 'hipnose_dia_%')
  ORDER BY user_id, finished_at DESC
)
UPDATE public.user_progress_summary ups
SET last_completed_type = lc.ltype,
    last_completed_day = lc.lday,
    last_completed_at = lc.lat,
    last_completed_label = lc.llabel,
    updated_at = NOW()
FROM last_completed lc
WHERE ups.user_id = lc.user_id;
