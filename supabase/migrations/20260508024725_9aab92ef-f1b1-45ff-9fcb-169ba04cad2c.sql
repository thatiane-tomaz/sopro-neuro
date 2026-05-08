ALTER TABLE public.onboarding_responses
  ADD COLUMN IF NOT EXISTS cigarettes_per_day integer,
  ADD COLUMN IF NOT EXISTS vapes_per_week integer,
  ADD COLUMN IF NOT EXISTS last_cigarette_date date,
  ADD COLUMN IF NOT EXISTS weekly_cost_value numeric;

-- Allow users to UPDATE their own onboarding (needed to edit last_cigarette_date)
DROP POLICY IF EXISTS "Users can update their own onboarding responses" ON public.onboarding_responses;
CREATE POLICY "Users can update their own onboarding responses"
ON public.onboarding_responses
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);