
-- Popular user_progress_summary com dados existentes
INSERT INTO public.user_progress_summary (user_id, email, max_unlocked_day, last_app_access)
SELECT 
  p.user_id,
  p.email,
  LEAST(
    COALESCE(
      (SELECT MAX(
        CASE 
          WHEN jt.interaction_type LIKE 'video_dia_%' 
            AND jt.progress_percentage >= 98 
            AND jt.finished_at IS NOT NULL 
          THEN CAST(REPLACE(jt.interaction_type, 'video_dia_', '') AS integer)
          ELSE 0
        END
      ) FROM journey_tracking jt WHERE jt.user_id = p.user_id),
      0
    ) + 1,
    21
  ) AS max_unlocked_day,
  COALESCE(
    (SELECT MAX(opened_at) FROM app_sessions s WHERE s.user_id = p.user_id),
    p.created_at
  ) AS last_app_access
FROM profiles p
ON CONFLICT (user_id) DO UPDATE SET
  email = EXCLUDED.email,
  max_unlocked_day = EXCLUDED.max_unlocked_day,
  last_app_access = EXCLUDED.last_app_access,
  updated_at = NOW();
