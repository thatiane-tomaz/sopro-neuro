import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const { user, loading } = useAuth();

  useEffect(() => {
    let isMounted = true;
    
    const checkOnboardingStatus = async () => {
      if (!user) {
        if (isMounted) setHasCompletedOnboarding(false);
        return;
      }

      // Authenticated user - check database for onboarding status
      try {
        const { data: existingResponse, error } = await supabase
          .from('onboarding_responses')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (isMounted) {
          setHasCompletedOnboarding(!!existingResponse && !error);
        }
      } catch (error) {
        console.error('Error checking onboarding:', error);
        if (isMounted) setHasCompletedOnboarding(false);
      }
    };

    if (!loading) {
      checkOnboardingStatus();
    }
    
    return () => {
      isMounted = false;
    };
  }, [user, loading]);

  if (loading || hasCompletedOnboarding === null) {
    return null; // Loading state
  }

  // Authenticated user who completed onboarding -> dashboard
  if (user && hasCompletedOnboarding) {
    return <Navigate to="/dashboard" replace />;
  }

  // Authenticated user who hasn't completed onboarding -> onboarding
  if (user && !hasCompletedOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  // Not authenticated -> login
  return <Navigate to="/login" replace />;
};

export default Index;
