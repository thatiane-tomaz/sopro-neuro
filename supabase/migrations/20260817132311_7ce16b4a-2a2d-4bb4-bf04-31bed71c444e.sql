-- 1. button_clicks: remover leitura pública, restringir a admins
DROP POLICY IF EXISTS "Public read clicks" ON public.button_clicks;
DROP POLICY IF EXISTS "Admins can read clicks" ON public.button_clicks;
CREATE POLICY "Admins can read clicks"
ON public.button_clicks
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

REVOKE SELECT ON public.button_clicks FROM anon;
GRANT SELECT ON public.button_clicks TO authenticated;
GRANT ALL ON public.button_clicks TO service_role;

-- 2. Funções SECURITY DEFINER: remover execução de anon/PUBLIC
REVOKE ALL ON FUNCTION public.award_sparks(text, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.register_login_and_award() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.mark_start_here_seen() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.increment_button_click(text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_day_completed(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_day_completion_time(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_current_subscription(uuid) FROM PUBLIC, anon, authenticated;

-- 3. Reconceder apenas o necessário
GRANT EXECUTE ON FUNCTION public.award_sparks(text, jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.register_login_and_award() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.mark_start_here_seen() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.increment_button_click(text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.is_day_completed(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_day_completion_time(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_current_subscription(uuid) TO service_role;