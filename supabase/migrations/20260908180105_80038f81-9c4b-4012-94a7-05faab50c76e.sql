CREATE TABLE public.subscriptions_daily (
  report_date date PRIMARY KEY,
  accounts_created integer NOT NULL DEFAULT 0,
  payments integer NOT NULL DEFAULT 0,
  accounts_created_reduction integer NOT NULL DEFAULT 0,
  accounts_created_freedom integer NOT NULL DEFAULT 0,
  payments_reduction integer NOT NULL DEFAULT 0,
  payments_freedom integer NOT NULL DEFAULT 0,
  accounts_created_android integer NOT NULL DEFAULT 0,
  accounts_created_ios integer NOT NULL DEFAULT 0,
  payments_android integer NOT NULL DEFAULT 0,
  payments_ios integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT ALL ON public.subscriptions_daily TO service_role;
ALTER TABLE public.subscriptions_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage subscriptions_daily" ON public.subscriptions_daily
  FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS platform text;
ALTER TABLE public.app_sessions ADD COLUMN IF NOT EXISTS platform text;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS platform text;

CREATE OR REPLACE FUNCTION public.get_user_journey(p_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jornada_inicial
  FROM public.onboarding_responses_v2
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.increment_daily_accounts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_date date;
  v_platform text;
BEGIN
  v_date := (NEW.created_at AT TIME ZONE 'America/Sao_Paulo')::date;
  v_platform := COALESCE(LOWER(NEW.platform), 'unknown');

  INSERT INTO public.subscriptions_daily (report_date, accounts_created)
  VALUES (v_date, 1)
  ON CONFLICT (report_date) DO UPDATE
    SET accounts_created = public.subscriptions_daily.accounts_created + 1,
        updated_at = now();

  IF v_platform = 'android' THEN
    UPDATE public.subscriptions_daily
    SET accounts_created_android = accounts_created_android + 1
    WHERE report_date = v_date;
  ELSIF v_platform = 'ios' THEN
    UPDATE public.subscriptions_daily
    SET accounts_created_ios = accounts_created_ios + 1
    WHERE report_date = v_date;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_increment_daily_accounts ON public.profiles;
CREATE TRIGGER trg_increment_daily_accounts
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.increment_daily_accounts();

CREATE OR REPLACE FUNCTION public.increment_daily_journey_accounts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_date date;
BEGIN
  v_date := (NEW.created_at AT TIME ZONE 'America/Sao_Paulo')::date;

  IF NEW.jornada_inicial = 'reducao' THEN
    INSERT INTO public.subscriptions_daily (report_date, accounts_created_reduction)
    VALUES (v_date, 1)
    ON CONFLICT (report_date) DO UPDATE
      SET accounts_created_reduction = public.subscriptions_daily.accounts_created_reduction + 1,
          updated_at = now();
  ELSIF NEW.jornada_inicial = 'liberdade' THEN
    INSERT INTO public.subscriptions_daily (report_date, accounts_created_freedom)
    VALUES (v_date, 1)
    ON CONFLICT (report_date) DO UPDATE
      SET accounts_created_freedom = public.subscriptions_daily.accounts_created_freedom + 1,
          updated_at = now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_increment_daily_journey_accounts ON public.onboarding_responses_v2;
CREATE TRIGGER trg_increment_daily_journey_accounts
  AFTER INSERT ON public.onboarding_responses_v2
  FOR EACH ROW EXECUTE FUNCTION public.increment_daily_journey_accounts();

CREATE OR REPLACE FUNCTION public.increment_daily_payments()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_date date;
  v_journey text;
  v_platform text;
  v_old_status text;
BEGIN
  v_old_status := COALESCE(OLD.status::text, 'free');

  IF NEW.status <> 'premium' OR v_old_status = 'premium' THEN
    RETURN NEW;
  END IF;

  v_date := (NEW.started_at AT TIME ZONE 'America/Sao_Paulo')::date;
  v_journey := public.get_user_journey(NEW.user_id);
  v_platform := COALESCE(LOWER(NEW.platform), 'unknown');

  INSERT INTO public.subscriptions_daily (report_date, payments)
  VALUES (v_date, 1)
  ON CONFLICT (report_date) DO UPDATE
    SET payments = public.subscriptions_daily.payments + 1,
        updated_at = now();

  IF v_journey = 'reducao' THEN
    UPDATE public.subscriptions_daily
    SET payments_reduction = payments_reduction + 1
    WHERE report_date = v_date;
  ELSIF v_journey = 'liberdade' THEN
    UPDATE public.subscriptions_daily
    SET payments_freedom = payments_freedom + 1
    WHERE report_date = v_date;
  END IF;

  IF v_platform = 'android' THEN
    UPDATE public.subscriptions_daily
    SET payments_android = payments_android + 1
    WHERE report_date = v_date;
  ELSIF v_platform = 'ios' THEN
    UPDATE public.subscriptions_daily
    SET payments_ios = payments_ios + 1
    WHERE report_date = v_date;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_increment_daily_payments ON public.subscriptions;
CREATE TRIGGER trg_increment_daily_payments
  AFTER INSERT OR UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.increment_daily_payments();

CREATE OR REPLACE FUNCTION public.update_profile_platform_from_session()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.platform IS NOT NULL THEN
    UPDATE public.profiles
    SET platform = NEW.platform,
        updated_at = now()
    WHERE user_id = NEW.user_id
      AND (platform IS NULL OR platform = 'web');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_profile_platform_from_session ON public.app_sessions;
CREATE TRIGGER trg_update_profile_platform_from_session
  AFTER INSERT ON public.app_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_profile_platform_from_session();

CREATE OR REPLACE FUNCTION public.recalculate_subscriptions_daily(p_from date, p_to date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  d date;
BEGIN
  FOR d IN SELECT generate_series(p_from, p_to, '1 day'::interval)::date LOOP
    DELETE FROM public.subscriptions_daily WHERE report_date = d;

    INSERT INTO public.subscriptions_daily (
      report_date,
      accounts_created,
      payments,
      accounts_created_reduction,
      accounts_created_freedom,
      payments_reduction,
      payments_freedom,
      accounts_created_android,
      accounts_created_ios,
      payments_android,
      payments_ios
    )
    SELECT
      d,
      COUNT(DISTINCT p.user_id) FILTER (WHERE (p.created_at AT TIME ZONE 'America/Sao_Paulo')::date = d) AS accounts_created,
      COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'premium' AND (s.started_at AT TIME ZONE 'America/Sao_Paulo')::date = d) AS payments,
      COUNT(DISTINCT p.user_id) FILTER (WHERE (p.created_at AT TIME ZONE 'America/Sao_Paulo')::date = d AND o.jornada_inicial = 'reducao') AS accounts_created_reduction,
      COUNT(DISTINCT p.user_id) FILTER (WHERE (p.created_at AT TIME ZONE 'America/Sao_Paulo')::date = d AND o.jornada_inicial = 'liberdade') AS accounts_created_freedom,
      COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'premium' AND (s.started_at AT TIME ZONE 'America/Sao_Paulo')::date = d AND o.jornada_inicial = 'reducao') AS payments_reduction,
      COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'premium' AND (s.started_at AT TIME ZONE 'America/Sao_Paulo')::date = d AND o.jornada_inicial = 'liberdade') AS payments_freedom,
      COUNT(DISTINCT p.user_id) FILTER (WHERE (p.created_at AT TIME ZONE 'America/Sao_Paulo')::date = d AND LOWER(p.platform) = 'android') AS accounts_created_android,
      COUNT(DISTINCT p.user_id) FILTER (WHERE (p.created_at AT TIME ZONE 'America/Sao_Paulo')::date = d AND LOWER(p.platform) = 'ios') AS accounts_created_ios,
      COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'premium' AND (s.started_at AT TIME ZONE 'America/Sao_Paulo')::date = d AND LOWER(s.platform) = 'android') AS payments_android,
      COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'premium' AND (s.started_at AT TIME ZONE 'America/Sao_Paulo')::date = d AND LOWER(s.platform) = 'ios') AS payments_ios
    FROM public.profiles p
    LEFT JOIN public.onboarding_responses_v2 o ON o.user_id = p.user_id
    LEFT JOIN public.subscriptions s ON s.user_id = p.user_id
    WHERE (p.created_at AT TIME ZONE 'America/Sao_Paulo')::date = d
       OR (s.status = 'premium' AND (s.started_at AT TIME ZONE 'America/Sao_Paulo')::date = d);
  END LOOP;
END;
$$;
