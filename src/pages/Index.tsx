import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import Landing from "./Landing";

const Index = () => {
  const [isFirstVisit, setIsFirstVisit] = useState<boolean | null>(null);

  useEffect(() => {
    const hasVisitedBefore = localStorage.getItem("sopro-visited");
    
    if (!hasVisitedBefore) {
      localStorage.setItem("sopro-visited", "true");
      setIsFirstVisit(true);
    } else {
      setIsFirstVisit(false);
    }
  }, []);

  if (isFirstVisit === null) {
    return null; // Loading state
  }

  if (!isFirstVisit) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Landing />;
};

export default Index;
