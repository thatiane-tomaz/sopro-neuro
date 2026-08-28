CREATE TABLE public.journey_tracking_backup (LIKE public.journey_tracking INCLUDING DEFAULTS);
ALTER TABLE public.journey_tracking_backup ADD COLUMN backed_up_at timestamptz NOT NULL DEFAULT now();
GRANT ALL ON public.journey_tracking_backup TO service_role;
GRANT SELECT ON public.journey_tracking_backup TO authenticated;
ALTER TABLE public.journey_tracking_backup ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view journey tracking backup" ON public.journey_tracking_backup FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.historico_jornada_usuario_backup (LIKE public.historico_jornada_usuario INCLUDING DEFAULTS);
ALTER TABLE public.historico_jornada_usuario_backup ADD COLUMN backed_up_at timestamptz NOT NULL DEFAULT now();
GRANT ALL ON public.historico_jornada_usuario_backup TO service_role;
GRANT SELECT ON public.historico_jornada_usuario_backup TO authenticated;
ALTER TABLE public.historico_jornada_usuario_backup ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view historico backup" ON public.historico_jornada_usuario_backup FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.resultado_missao_usuario_backup (LIKE public.resultado_missao_usuario INCLUDING DEFAULTS);
ALTER TABLE public.resultado_missao_usuario_backup ADD COLUMN backed_up_at timestamptz NOT NULL DEFAULT now();
GRANT ALL ON public.resultado_missao_usuario_backup TO service_role;
GRANT SELECT ON public.resultado_missao_usuario_backup TO authenticated;
ALTER TABLE public.resultado_missao_usuario_backup ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view missao backup" ON public.resultado_missao_usuario_backup FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.user_progress_summary_backup (LIKE public.user_progress_summary INCLUDING DEFAULTS);
ALTER TABLE public.user_progress_summary_backup ADD COLUMN backed_up_at timestamptz NOT NULL DEFAULT now();
GRANT ALL ON public.user_progress_summary_backup TO service_role;
GRANT SELECT ON public.user_progress_summary_backup TO authenticated;
ALTER TABLE public.user_progress_summary_backup ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view progress summary backup" ON public.user_progress_summary_backup FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.content_views_backup (LIKE public.content_views INCLUDING DEFAULTS);
ALTER TABLE public.content_views_backup ADD COLUMN backed_up_at timestamptz NOT NULL DEFAULT now();
GRANT ALL ON public.content_views_backup TO service_role;
GRANT SELECT ON public.content_views_backup TO authenticated;
ALTER TABLE public.content_views_backup ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view content views backup" ON public.content_views_backup FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));