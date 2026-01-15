-- Add column to track when last push notification was sent
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_push_sent_at timestamp with time zone;