-- 1. Add email column to subscriptions (to identify before signup)
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS email text;

-- 2. Add amount_paid column
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS amount_paid integer;

-- 3. Make user_id nullable (subscription exists before user account)
ALTER TABLE public.subscriptions 
ALTER COLUMN user_id DROP NOT NULL;

-- 4. Remove the trigger that creates free subscriptions on profile creation (with CASCADE)
DROP TRIGGER IF EXISTS on_profile_created_init_subscription ON public.profiles;
DROP FUNCTION IF EXISTS public.initialize_free_subscription() CASCADE;

-- 5. Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_email ON public.subscriptions(email);

-- 6. Add unique constraint on email to prevent duplicates
ALTER TABLE public.subscriptions 
ADD CONSTRAINT subscriptions_email_unique UNIQUE (email);

-- 7. Update RLS policy to allow checking subscription by email (for unauthenticated users during signup)
DROP POLICY IF EXISTS "Check subscription by email" ON public.subscriptions;
CREATE POLICY "Check subscription by email" 
ON public.subscriptions 
FOR SELECT 
USING (true);

-- 8. Allow edge functions to insert/update subscriptions
DROP POLICY IF EXISTS "Service role can update subscriptions" ON public.subscriptions;
CREATE POLICY "Service role can update subscriptions" 
ON public.subscriptions 
FOR UPDATE 
USING (true);