-- Remove existing user update policy on profiles
DROP POLICY IF EXISTS "Users can update profile name only" ON public.profiles;

-- Remove existing user insert policy on profiles
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Add admin-only management policy for profiles
CREATE POLICY "Admins can manage profiles" 
ON public.profiles 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'::app_role));