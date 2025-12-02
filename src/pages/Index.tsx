import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Capacitor } from "@capacitor/core";

const Index = () => {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const [isInstalledApp, setIsInstalledApp] = useState<boolean | null>(null);
  const { user, loading } = useAuth();

  useEffect(() => {
    // Native app (Capacitor) sempre é instalado
    if (Capacitor.isNativePlatform()) {
      setIsInstalledApp(true);
      return;
    }
    
    // PWA instalado
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  (window.navigator as any).standalone === true;
    setIsInstalledApp(isPWA);
  }, []);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) {
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
      } catch (error) {
        console.error('Error checking onboarding:', error);
        setHasCompletedOnboarding(false);
      }
    };

    if (!loading) {
      checkOnboardingStatus();
    }
  }, [user, loading]);

  if (loading || hasCompletedOnboarding === null || isInstalledApp === null) {
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

  // Not authenticated + app installed (PWA/native) -> login
  if (!user && isInstalledApp) {
    return <Navigate to="/login" replace />;
  }

  // Not authenticated + web browser -> landing page
  return <Navigate to="/landing" replace />;
};

export default Index;
