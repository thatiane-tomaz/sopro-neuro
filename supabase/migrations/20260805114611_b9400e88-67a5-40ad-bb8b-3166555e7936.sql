REVOKE EXECUTE ON FUNCTION public.assign_default_role() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.upsert_user_progress_on_session() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.auto_complete_high_progress() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_current_subscription(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_day_completion_time(uuid, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_day_completed(uuid, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.award_sparks(text, jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.register_login_and_award() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.mark_start_here_seen() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_button_click(text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.award_sparks(text, jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.register_login_and_award() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.mark_start_here_seen() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.increment_button_click(text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon, authenticated, service_role;