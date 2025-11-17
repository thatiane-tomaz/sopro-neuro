import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [isFirstVisit, setIsFirstVisit] = useState<boolean | null>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const { user, loading } = useAuth();

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) {
        // Not authenticated, show landing page
        const hasVisitedBefore = localStorage.getItem("sopro-visited");
        if (!hasVisitedBefore) {
          localStorage.setItem("sopro-visited", "true");
          setIsFirstVisit(true);
        } else {
          setIsFirstVisit(false);
        }
        setHasCompletedOnboarding(false);
        return;
      }

      // Authenticated user - check database for onboarding status
      try {
        const { data: existingResponse, error } = await supabase
          .from('onboarding_responses')
          .select('id')
          .eq('user_id', user.id)
          .single();

        setHasCompletedOnboarding(!!existingResponse && !error);
        setIsFirstVisit(false);
      } catch (error) {
        console.error('Error checking onboarding:', error);
        setHasCompletedOnboarding(false);
        setIsFirstVisit(false);
      }
    };

    if (!loading) {
      checkOnboardingStatus();
    }
  }, [user, loading]);

  if (loading || isFirstVisit === null || hasCompletedOnboarding === null) {
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

  // Not authenticated -> redirect to login
  return <Navigate to="/login" replace />;
};

export default Index;
