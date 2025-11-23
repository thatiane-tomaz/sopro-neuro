-- Drop support_content table
DROP TABLE IF EXISTS public.support_content CASCADE;

-- Add file_name column to triggers_content
ALTER TABLE public.triggers_content
ADD COLUMN IF NOT EXISTS file_name text NOT NULL DEFAULT '';