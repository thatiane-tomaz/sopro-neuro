-- Remove the insecure policy that allows anyone to read all whitelist entries
DROP POLICY IF EXISTS "Anyone can check whitelist" ON public.freelist_users;

-- Create a secure policy that only allows authenticated users to check their own email
CREATE POLICY "Users can check their own email in freelist"
ON public.freelist_users
FOR SELECT
TO authenticated
USING (email = auth.email());