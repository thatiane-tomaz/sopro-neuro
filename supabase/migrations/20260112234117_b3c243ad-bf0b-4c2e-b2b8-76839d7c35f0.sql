-- Delete user from auth.users (cascades to profiles, onboarding_responses, etc.)
DELETE FROM auth.users WHERE email = 'thatiane.hltomaz@gmail.com';