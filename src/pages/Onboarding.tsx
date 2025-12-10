import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Question1 from "@/components/onboarding/Question1";
import Question2 from "@/components/onboarding/Question2";
import Question3 from "@/components/onboarding/Question3";
import Question4 from "@/components/onboarding/Question4";
import Question5 from "@/components/onboarding/Question5";

export interface OnboardingData {
  age: string;
  gender: string;
  smokingFrequency: string;
  smokingTypes: string[];
  smokingReasons: string[];
  weeklyCost: string;
}

const Onboarding = () => {
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    age: "",
    gender: "",
    smokingFrequency: "",
    smokingTypes: [],
    smokingReasons: [],
    weeklyCost: ""
  });
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const { user, loading } = useAuth();
  const { toast } = useToast();

  // Check if user already completed onboarding
  useEffect(() => {
    let isMounted = true;
    
    const checkOnboardingStatus = async () => {
      if (!user) {
        if (isMounted) setCheckingOnboarding(false);
        return;
      }

      try {
        const { data: existingResponse, error } = await supabase
          .from('onboarding_responses')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!isMounted) return;

        if (existingResponse && !error) {
          // User already completed onboarding, redirect to dashboard
          window.location.href = "/dashboard";
        } else {
          setCheckingOnboarding(false);
        }
      } catch (error) {
        console.error('Error checking onboarding:', error);
        if (isMounted) setCheckingOnboarding(false);
      }
    };

    if (!loading) {
      checkOnboardingStatus();
    }
    
    return () => {
      isMounted = false;
    };
  }, [user, loading]);

  // Redirect to login if not authenticated
  if (!loading && !user) {
    return <Navigate to="/login" replace />;
  }

  if (loading || checkingOnboarding) {
    return <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center">
      <div className="text-center">Carregando...</div>
    </div>;
  }

  const updateData = (newData: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...newData }));
  };

  const nextQuestion = () => {
    if (currentQuestion < 5) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 1) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const finishOnboarding = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('onboarding_responses')
        .insert({
          user_id: user.id,
          age: data.age,
          gender: data.gender,
          smoking_frequency: data.smokingFrequency,
          smoking_types: data.smokingTypes,
          smoking_reasons: data.smokingReasons,
          weekly_cost: data.weeklyCost
        });

      if (error) throw error;
      
      toast({
        title: "Onboarding concluído",
        description: "Suas respostas foram salvas com sucesso!"
      });
      
      window.location.href = "/dashboard";
    } catch (error) {
      console.error('Error saving onboarding:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar suas respostas. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const questionComponents = {
    1: <Question1 data={data} updateData={updateData} onNext={nextQuestion} />,
    2: <Question2 data={data} updateData={updateData} onNext={nextQuestion} onPrev={prevQuestion} />,
    3: <Question3 data={data} updateData={updateData} onNext={nextQuestion} onPrev={prevQuestion} />,
    4: <Question4 data={data} updateData={updateData} onNext={nextQuestion} onPrev={prevQuestion} />,
    5: <Question5 data={data} updateData={updateData} onFinish={finishOnboarding} onPrev={prevQuestion} />
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      {questionComponents[currentQuestion as keyof typeof questionComponents]}
    </div>
  );
};

export default Onboarding;