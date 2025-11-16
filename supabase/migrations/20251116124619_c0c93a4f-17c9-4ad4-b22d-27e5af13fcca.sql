-- Add weekly_cost column to onboarding_responses table
ALTER TABLE public.onboarding_responses
ADD COLUMN weekly_cost text;