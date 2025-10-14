-- Remove welcome_subtitle field from daily_content table
ALTER TABLE public.daily_content
DROP COLUMN welcome_subtitle;