CREATE TABLE public.notification_campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('fixa','gatilho','rotativa','esporadica')),
  title text NOT NULL DEFAULT 'Sopro',
  message text NOT NULL,
  journey text NOT NULL DEFAULT 'ambas' CHECK (journey IN ('reducao','liberdade','ambas')),
  active boolean NOT NULL DEFAULT true,
  frequency text CHECK (frequency IN ('daily','weekly')),
  slot_hours integer[] NOT NULL DEFAULT '{}',
  slot_minute integer NOT NULL DEFAULT 0 CHECK (slot_minute IN (0,30)),
  weekday integer CHECK (weekday BETWEEN 0 AND 6),
  trigger_key text CHECK (trigger_key IN ('missao_pronta','inativo_3d','sem_registro_3d')),
  min_hours_between integer NOT NULL DEFAULT 72,
  priority integer NOT NULL DEFAULT 100,
  send_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_campaigns TO authenticated;
GRANT ALL ON public.notification_campaigns TO service_role;
ALTER TABLE public.notification_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage campaigns" ON public.notification_campaigns
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER notification_campaigns_updated_at
  BEFORE UPDATE ON public.notification_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.notification_sends (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid NOT NULL REFERENCES public.notification_campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  kind text NOT NULL,
  slot text,
  onesignal_response jsonb,
  sent_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.notification_sends TO authenticated;
GRANT ALL ON public.notification_sends TO service_role;
ALTER TABLE public.notification_sends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view sends" ON public.notification_sends
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX notification_sends_user_sent_idx ON public.notification_sends (user_id, sent_at DESC);
CREATE INDEX notification_sends_campaign_user_idx ON public.notification_sends (campaign_id, user_id, sent_at DESC);