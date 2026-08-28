CREATE TABLE public.onboarding_responses_backup (LIKE public.onboarding_responses INCLUDING DEFAULTS);
ALTER TABLE public.onboarding_responses_backup ADD COLUMN backed_up_at timestamptz NOT NULL DEFAULT now();
GRANT ALL ON public.onboarding_responses_backup TO service_role;
GRANT SELECT ON public.onboarding_responses_backup TO authenticated;
ALTER TABLE public.onboarding_responses_backup ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view onboarding backup" ON public.onboarding_responses_backup FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.onboarding_responses_v2_backup (LIKE public.onboarding_responses_v2 INCLUDING DEFAULTS);
ALTER TABLE public.onboarding_responses_v2_backup ADD COLUMN backed_up_at timestamptz NOT NULL DEFAULT now();
GRANT ALL ON public.onboarding_responses_v2_backup TO service_role;
GRANT SELECT ON public.onboarding_responses_v2_backup TO authenticated;
ALTER TABLE public.onboarding_responses_v2_backup ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view onboarding v2 backup" ON public.onboarding_responses_v2_backup FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));