
CREATE TABLE public.daily_smoking_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  cigarettes_count INTEGER NOT NULL CHECK (cigarettes_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, log_date)
);

CREATE INDEX daily_smoking_logs_user_date_idx
  ON public.daily_smoking_logs (user_id, log_date DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_smoking_logs TO authenticated;
GRANT ALL ON public.daily_smoking_logs TO service_role;

ALTER TABLE public.daily_smoking_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own smoking logs"
  ON public.daily_smoking_logs
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all smoking logs"
  ON public.daily_smoking_logs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_daily_smoking_logs_updated_at
  BEFORE UPDATE ON public.daily_smoking_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed fake data for admin users (last 21 days, gradual reduction from 20 -> 3)
DO $$
DECLARE
  admin_id UUID;
  d INTEGER;
  base INTEGER;
  reduction NUMERIC;
  count_val INTEGER;
BEGIN
  FOR admin_id IN
    SELECT ur.user_id
    FROM public.user_roles ur
    WHERE ur.role = 'admin'
  LOOP
    base := 20;
    FOR d IN 0..20 LOOP
      -- Smooth downward curve with a bit of noise
      reduction := (d::NUMERIC / 20.0) * 17.0;
      count_val := GREATEST(
        0,
        ROUND(base - reduction + (random() * 4 - 2))::INTEGER
      );
      INSERT INTO public.daily_smoking_logs (user_id, log_date, cigarettes_count)
      VALUES (admin_id, (CURRENT_DATE - (20 - d))::DATE, count_val)
      ON CONFLICT (user_id, log_date) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;
