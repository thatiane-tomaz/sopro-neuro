import { useState } from "react";
import { Navigate } from "react-router-dom";
import Question1 from "@/components/onboarding/Question1";
import Question2 from "@/components/onboarding/Question2";
import Question3 from "@/components/onboarding/Question3";
import Question4 from "@/components/onboarding/Question4";

export interface OnboardingData {
  age: string;
  gender: string;
  smokingFrequency: string;
  smokingTypes: string[];
  smokingReasons: string[];
}

const Onboarding = () => {
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    age: "",
    gender: "",
    smokingFrequency: "",
    smokingTypes: [],
    smokingReasons: []
  });

  const updateData = (newData: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...newData }));
  };

  const nextQuestion = () => {
    if (currentQuestion < 4) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 1) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const finishOnboarding = () => {
    localStorage.setItem("sopro-onboarding-completed", "true");
    localStorage.setItem("sopro-onboarding-data", JSON.stringify(data));
    // Trigger completion
    window.location.href = "/dashboard";
  };

  // Check if onboarding is already completed
  const isCompleted = localStorage.getItem("sopro-onboarding-completed");
  if (isCompleted) {
    return <Navigate to="/dashboard" replace />;
  }

  const questionComponents = {
    1: <Question1 data={data} updateData={updateData} onNext={nextQuestion} />,
    2: <Question2 data={data} updateData={updateData} onNext={nextQuestion} onPrev={prevQuestion} />,
    3: <Question3 data={data} updateData={updateData} onNext={nextQuestion} onPrev={prevQuestion} />,
    4: <Question4 data={data} updateData={updateData} onFinish={finishOnboarding} onPrev={prevQuestion} />
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      {questionComponents[currentQuestion as keyof typeof questionComponents]}
    </div>
  );
};

export default Onboarding;