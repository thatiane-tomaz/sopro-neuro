-- Create whitelist table for users who can access without payment
CREATE TABLE public.whitelist_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.whitelist_users ENABLE ROW LEVEL SECURITY;

-- Allow checking whitelist (for signup verification)
CREATE POLICY "Anyone can check whitelist" 
ON public.whitelist_users 
FOR SELECT 
USING (true);

-- Only admins can manage whitelist
CREATE POLICY "Admins can manage whitelist" 
ON public.whitelist_users 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster email lookups
CREATE INDEX idx_whitelist_email ON public.whitelist_users(email);