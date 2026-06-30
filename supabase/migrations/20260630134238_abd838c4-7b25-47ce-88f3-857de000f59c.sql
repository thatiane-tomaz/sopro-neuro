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
  v_highest_completed integer := 0;
  d integer;
BEGIN
  SELECT email INTO v_email FROM profiles WHERE user_id = NEW.user_id LIMIT 1;

  -- Compute highest completed day using app rules:
  -- Phase 1 (days 1-7): requires BOTH video and hypnosis finished
  -- Phase 2 (days 8-14): requires ONLY hypnosis finished
  FOR d IN 1..14 LOOP
    IF d <= 7 THEN
      IF EXISTS (
        SELECT 1 FROM journey_tracking
        WHERE user_id = NEW.user_id
          AND interaction_type = 'video_dia_' || d
          AND finished_at IS NOT NULL
      ) AND EXISTS (
        SELECT 1 FROM journey_tracking
        WHERE user_id = NEW.user_id
          AND interaction_type = 'hipnose_dia_' || d
          AND finished_at IS NOT NULL
      ) THEN
        v_highest_completed := d;
      END IF;
    ELSE
      IF EXISTS (
        SELECT 1 FROM journey_tracking
        WHERE user_id = NEW.user_id
          AND interaction_type = 'hipnose_dia_' || d
          AND finished_at IS NOT NULL
      ) THEN
        v_highest_completed := d;
      END IF;
    END IF;
  END LOOP;

  v_max_day := LEAST(v_highest_completed + 1, 14);
  IF v_max_day < 1 THEN
    v_max_day := 1;
  END IF;

  -- Last completed content (video or hipnose)
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

-- Backfill max_unlocked_day for all existing users using the same rule
WITH per_user AS (
  SELECT
    ups.user_id,
    COALESCE(MAX(
      CASE
        WHEN d.day <= 7 THEN
          CASE WHEN EXISTS (
            SELECT 1 FROM journey_tracking jt1
            WHERE jt1.user_id = ups.user_id
              AND jt1.interaction_type = 'video_dia_' || d.day
              AND jt1.finished_at IS NOT NULL
          ) AND EXISTS (
            SELECT 1 FROM journey_tracking jt2
            WHERE jt2.user_id = ups.user_id
              AND jt2.interaction_type = 'hipnose_dia_' || d.day
              AND jt2.finished_at IS NOT NULL
          ) THEN d.day END
        ELSE
          CASE WHEN EXISTS (
            SELECT 1 FROM journey_tracking jt3
            WHERE jt3.user_id = ups.user_id
              AND jt3.interaction_type = 'hipnose_dia_' || d.day
              AND jt3.finished_at IS NOT NULL
          ) THEN d.day END
      END
    ), 0) AS highest_completed
  FROM user_progress_summary ups
  CROSS JOIN generate_series(1, 14) AS d(day)
  GROUP BY ups.user_id
)
UPDATE user_progress_summary ups
SET max_unlocked_day = LEAST(GREATEST(p.highest_completed + 1, 1), 14),
    updated_at = NOW()
FROM per_user p
WHERE ups.user_id = p.user_id;