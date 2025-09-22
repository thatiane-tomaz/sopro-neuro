-- Create subscriptions table to track user subscription history and status
CREATE TYPE subscription_status AS ENUM ('free', 'premium', 'cancelled', 'expired');
CREATE TYPE cancellation_reason AS ENUM ('user_request', 'payment_failed', 'expired', 'upgrade', 'downgrade', 'admin_action');

CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  status subscription_status NOT NULL DEFAULT 'free',
  plan_type TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  cancelled_at TIMESTAMP WITH TIME ZONE NULL,
  expires_at TIMESTAMP WITH TIME ZONE NULL,
  cancellation_reason cancellation_reason NULL,
  cancellation_notes TEXT NULL,
  previous_status subscription_status NULL,
  stripe_subscription_id TEXT NULL,
  stripe_customer_id TEXT NULL
);

-- Enable Row Level Security
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for subscriptions
CREATE POLICY "Users can view their own subscriptions" 
ON public.subscriptions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions" 
ON public.subscriptions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" 
ON public.subscriptions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all subscriptions" 
ON public.subscriptions 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_expires_at ON public.subscriptions(expires_at);

-- Insert default free subscriptions for existing users
INSERT INTO public.subscriptions (user_id, status, plan_type)
SELECT user_id, 'free'::subscription_status, 'free'
FROM public.profiles
WHERE user_id NOT IN (SELECT user_id FROM public.subscriptions);

-- Function to get current active subscription for a user
CREATE OR REPLACE FUNCTION public.get_current_subscription(user_uuid UUID)
RETURNS public.subscriptions
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.subscriptions
  WHERE user_id = user_uuid
  AND (expires_at IS NULL OR expires_at > now())
  AND status IN ('free', 'premium')
  ORDER BY created_at DESC
  LIMIT 1;
$$;