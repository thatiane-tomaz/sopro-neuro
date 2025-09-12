import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import Landing from "./Landing";

const Index = () => {
  const [isFirstVisit, setIsFirstVisit] = useState<boolean | null>(null);

  useEffect(() => {
    const hasVisitedBefore = localStorage.getItem("sopro-visited");
    const hasCompletedOnboarding = localStorage.getItem("sopro-onboarding-completed");
    
    if (!hasVisitedBefore) {
      localStorage.setItem("sopro-visited", "true");
      setIsFirstVisit(true);
    } else if (!hasCompletedOnboarding) {
      // User has visited before but hasn't completed onboarding
      setIsFirstVisit(false);
    } else {
      // User has completed onboarding, go to dashboard
      setIsFirstVisit(false);
    }
  }, []);

  if (isFirstVisit === null) {
    return null; // Loading state
  }

  // Check if user needs to go through onboarding
  const hasCompletedOnboarding = localStorage.getItem("sopro-onboarding-completed");
  
  if (!isFirstVisit && !hasCompletedOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  if (!isFirstVisit && hasCompletedOnboarding) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Landing />;
};

export default Index;
