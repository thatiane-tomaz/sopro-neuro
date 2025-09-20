-- Add subscription_status to profiles table
ALTER TABLE public.profiles 
ADD COLUMN subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'premium'));

-- Update existing users to free status
UPDATE public.profiles SET subscription_status = 'free' WHERE subscription_status IS NULL;