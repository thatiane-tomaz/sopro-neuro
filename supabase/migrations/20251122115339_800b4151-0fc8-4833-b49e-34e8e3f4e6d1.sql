-- Create feedback table
CREATE TABLE public.sopro_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  day_number INTEGER NOT NULL,
  question_type TEXT NOT NULL,
  response TEXT,
  rating INTEGER,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_day_number CHECK (day_number IN (1, 5, 7, 10, 14)),
  CONSTRAINT valid_rating CHECK (rating IS NULL OR (rating >= 0 AND rating <= 10))
);

-- Enable RLS
ALTER TABLE public.sopro_feedback ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own feedback"
ON public.sopro_feedback
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feedback"
ON public.sopro_feedback
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_sopro_feedback_user_day ON public.sopro_feedback(user_id, day_number);