-- Create function to initialize free subscription for new users
CREATE OR REPLACE FUNCTION public.initialize_free_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create free subscription for the new user
  INSERT INTO public.subscriptions (user_id, plan_type, status)
  VALUES (NEW.user_id, 'free', 'free');
  
  -- Update profile subscription status
  UPDATE public.profiles
  SET subscription_status = 'free'
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger to initialize subscription after profile is created
CREATE TRIGGER on_profile_created_init_subscription
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.initialize_free_subscription();