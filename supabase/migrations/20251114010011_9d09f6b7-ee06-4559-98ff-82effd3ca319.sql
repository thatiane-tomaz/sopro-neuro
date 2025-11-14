-- Allow service role to insert profiles (for triggers)
CREATE POLICY "Service role can insert profiles"
ON public.profiles
FOR INSERT
TO service_role
WITH CHECK (true);

-- Allow service role to insert user_roles (for triggers)
CREATE POLICY "Service role can insert user_roles"
ON public.user_roles
FOR INSERT
TO service_role
WITH CHECK (true);

-- Allow service role to insert subscriptions (for triggers)
CREATE POLICY "Service role can insert subscriptions"
ON public.subscriptions
FOR INSERT
TO service_role
WITH CHECK (true);