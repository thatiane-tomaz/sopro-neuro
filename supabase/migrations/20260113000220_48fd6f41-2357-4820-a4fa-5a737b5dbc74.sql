-- Remove the overly permissive policies that expose data publicly
DROP POLICY IF EXISTS "Check subscription by email" ON public.subscriptions;
DROP POLICY IF EXISTS "Service role can update subscriptions" ON public.subscriptions;

-- The edge functions use service role key which bypasses RLS, so we don't need these permissive policies
-- Users can only see their own subscriptions (policy already exists)
-- Admins can manage all subscriptions (policy already exists)
-- Service role operations bypass RLS automatically