-- Create journey_tracking table to track user interactions with content
CREATE TABLE public.journey_tracking (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  interaction_type text NOT NULL, -- 'video_dia_1', 'hipnose_dia_1', 'hipnose_apoio_relax', etc
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  finished_at timestamp with time zone NULL,
  progress_percentage integer DEFAULT 0, -- Track how much was watched/listened
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.journey_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own journey tracking"
ON public.journey_tracking
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own journey tracking"
ON public.journey_tracking
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journey tracking"
ON public.journey_tracking
FOR UPDATE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_journey_tracking_updated_at
BEFORE UPDATE ON public.journey_tracking
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_journey_tracking_user_id ON public.journey_tracking(user_id);
CREATE INDEX idx_journey_tracking_interaction ON public.journey_tracking(user_id, interaction_type);

-- Create function to check if user completed a day (both video and hypnosis at 98%+)
CREATE OR REPLACE FUNCTION public.is_day_completed(p_user_id uuid, p_day integer)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.journey_tracking
    WHERE user_id = p_user_id
      AND interaction_type = 'video_dia_' || p_day
      AND progress_percentage >= 98
      AND finished_at IS NOT NULL
  ) AND EXISTS (
    SELECT 1 FROM public.journey_tracking
    WHERE user_id = p_user_id
      AND interaction_type = 'hipnose_dia_' || p_day
      AND progress_percentage >= 98
      AND finished_at IS NOT NULL
  );
$$;

-- Create function to get last completed day timestamp
CREATE OR REPLACE FUNCTION public.get_day_completion_time(p_user_id uuid, p_day integer)
RETURNS timestamp with time zone
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT MAX(finished_at)
  FROM public.journey_tracking
  WHERE user_id = p_user_id
    AND interaction_type IN ('video_dia_' || p_day, 'hipnose_dia_' || p_day)
    AND progress_percentage >= 98
    AND finished_at IS NOT NULL;
$$;