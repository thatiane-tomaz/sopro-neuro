-- Trigger functions must never be callable via the API
REVOKE EXECUTE ON FUNCTION public.assign_default_role() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.upsert_user_progress_on_session() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_complete_high_progress() FROM anon, authenticated;

-- SECURITY DEFINER helpers that accept an arbitrary user id: server-side only
REVOKE EXECUTE ON FUNCTION public.get_current_subscription(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_day_completion_time(uuid, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_day_completed(uuid, integer) FROM anon, authenticated;

-- Self-scoped user functions: signed-in users only, never anonymous
REVOKE EXECUTE ON FUNCTION public.award_sparks(text, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.register_login_and_award() FROM anon;
REVOKE EXECUTE ON FUNCTION public.mark_start_here_seen() FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_button_click(text, text) FROM anon;

GRANT EXECUTE ON FUNCTION public.award_sparks(text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_login_and_award() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_start_here_seen() TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_button_click(text, text) TO authenticated;

-- has_role is used inside RLS policies, so both roles need EXECUTE
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon, authenticated;