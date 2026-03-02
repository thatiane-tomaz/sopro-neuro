
-- Remove sopro.neuro@gmail.com from freelist so Apple reviewer sees the paywall
DELETE FROM freelist_users WHERE email = 'sopro.neuro@gmail.com';

-- Delete onboarding responses so the reviewer goes through onboarding -> paywall
DELETE FROM onboarding_responses WHERE user_id = 'e42b38be-e95e-4d2c-b1f8-75b5bce05ef1';

-- Also clear any journey tracking so the account is fresh
DELETE FROM journey_tracking WHERE user_id = 'e42b38be-e95e-4d2c-b1f8-75b5bce05ef1';

-- Clear content views
DELETE FROM content_views WHERE user_id = 'e42b38be-e95e-4d2c-b1f8-75b5bce05ef1';

-- Clear feedback responses
DELETE FROM feedback_responses WHERE user_id = 'e42b38be-e95e-4d2c-b1f8-75b5bce05ef1';
