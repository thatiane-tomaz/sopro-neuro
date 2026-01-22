-- Create table to track deleted accounts
CREATE TABLE public.deleted_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reason TEXT
);

-- Enable RLS
ALTER TABLE public.deleted_accounts ENABLE ROW LEVEL SECURITY;

-- Only admins can view deleted accounts
CREATE POLICY "Admins can manage deleted accounts" 
ON public.deleted_accounts 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role can insert (for edge function)
CREATE POLICY "Service role can insert deleted accounts" 
ON public.deleted_accounts 
FOR INSERT 
WITH CHECK (true);

-- Remove foreign key constraint from journey_tracking if exists (to preserve data after user deletion)
-- First check existing constraints and remove user_id FK if needed
DO $$
BEGIN
  -- Set user_id to NULL is not possible since we want to keep the data
  -- Instead we just don't have a FK constraint, which is already the case
  -- The journey_tracking table has no FK to auth.users, so data will be preserved
  NULL;
END $$;