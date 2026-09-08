REVOKE EXECUTE ON FUNCTION public.increment_daily_accounts() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_daily_journey_accounts() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_daily_payments() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_profile_platform_from_session() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recalculate_subscriptions_daily(date, date) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_journey(uuid) FROM public, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.recalculate_subscriptions_daily(date, date) TO service_role;