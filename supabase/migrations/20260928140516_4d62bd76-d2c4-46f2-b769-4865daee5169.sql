ALTER TABLE public.app_error_logs ALTER COLUMN user_id SET DEFAULT auth.uid();
GRANT INSERT, SELECT ON public.app_error_logs TO authenticated;
GRANT INSERT ON public.app_error_logs TO anon;
GRANT ALL ON public.app_error_logs TO service_role;