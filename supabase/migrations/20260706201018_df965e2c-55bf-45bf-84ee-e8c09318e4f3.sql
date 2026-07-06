DELETE FROM public.daily_smoking_logs
WHERE created_at = TIMESTAMPTZ '2026-07-06 17:40:32.640514+00'
  AND user_id IN (
    SELECT user_id
    FROM public.user_roles
    WHERE role = 'admin'
  );