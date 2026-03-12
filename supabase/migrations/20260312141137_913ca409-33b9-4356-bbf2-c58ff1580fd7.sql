
INSERT INTO public.subscriptions (user_id, email, status, plan_type, started_at, expires_at, previous_status)
VALUES (
  'e42b38be-e95e-4d2c-b1f8-75b5bce05ef1',
  'sopro.neuro@gmail.com',
  'expired',
  'premium_30',
  now() - interval '35 days',
  now() - interval '5 days',
  'premium'
)
ON CONFLICT DO NOTHING;
