-- Update sopro.neuro@gmail.com subscription to active premium
UPDATE public.subscriptions 
SET status = 'premium', 
    expires_at = now() + interval '60 days',
    previous_status = NULL
WHERE id = '2d8852fe-43ae-4467-8388-f2e13f1c4d31';

-- Create expired subscription for thatiane
INSERT INTO public.subscriptions (user_id, email, status, plan_type, started_at, expires_at, previous_status)
VALUES (
  '01f33897-238d-4c11-aec6-9bdc97992bda',
  'thatiane.hltomaz@gmail.com',
  'expired',
  'premium_30',
  now() - interval '35 days',
  now() - interval '5 days',
  'premium'
);