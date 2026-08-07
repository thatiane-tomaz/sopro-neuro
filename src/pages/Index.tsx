import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import PageLoader from "@/components/home/PageLoader";

const Index = () => {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const { user, loading } = useAuth();

  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    
    const checkOnboardingStatus = async () => {
      if (!user) {
        if (isMounted) setHasCompletedOnboarding(false);
        return;
      }

      // Authenticated user - check database for onboarding status (legacy or v2)
      try {
        const [legacyResult, v2Result] = await Promise.all([
          supabase
            .from('onboarding_responses')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle(),
          supabase
            .from('onboarding_responses_v2')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle(),
        ]);

        const done =
          (!!legacyResult.data && !legacyResult.error) ||
          (!!v2Result.data && !v2Result.error);

        if (isMounted) setHasCompletedOnboarding(done);
      } catch (error) {
        console.error('Error checking onboarding:', error);
        // On network/permission failure assume the user already onboarded so we
        // never resend an existing user through the questionnaire.
        if (isMounted) setHasCompletedOnboarding(true);
      }
    };

    if (!loading) {
      // Small delay to prevent race conditions with auth state
      timeoutId = setTimeout(() => {
        if (isMounted) checkOnboardingStatus();
      }, 50);
    }
    
    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [user, loading]);

  // Safety net: never leave the user on an endless loading screen.
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 8000);
    return () => clearTimeout(t);
  }, []);

  if (timedOut && hasCompletedOnboarding === null) {
    return <Navigate to={user ? "/dashboard" : "/login"} replace />;
  }

  if (loading || hasCompletedOnboarding === null) {
    return <PageLoader />;
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
