import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import Question1 from "@/components/onboarding/Question1";
import Question2 from "@/components/onboarding/Question2";
import Question3 from "@/components/onboarding/Question3";
import Question5 from "@/components/onboarding/Question5";
import Question7 from "@/components/onboarding/Question7";
import HabitCheckboxQuestion from "@/components/onboarding/HabitCheckboxQuestion";
import IntroScreen from "@/components/onboarding/IntroScreen";
import {
  EMOTION_OPTIONS,
  MOMENT_OPTIONS,
  SUBSTANCE_OPTIONS,
  selectedHabitos,
} from "@/components/onboarding/habitOptions";
import CompletionScreen from "@/components/onboarding/CompletionScreen";

export interface OnboardingData {
  age: string;
  gender: string;
  cigarettesPerDay: string;
  vapesPerMonth: string;
  smokingTypes: string[];
  smokingReasons: string[];
  smokingFears: string[];
  weeklyCost: string;
  habitEmotions: string[];
  habitMoments: string[];
  habitSubstances: string[];
  journeyType: "reducao" | "abstinencia" | "";
}

const Onboarding = () => {
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    age: "",
    gender: "",
    cigarettesPerDay: "",
    vapesPerMonth: "",
    smokingTypes: [],
    smokingReasons: [],
    smokingFears: [],
    weeklyCost: "",
    habitEmotions: [],
    habitMoments: [],
    habitSubstances: [],
    journeyType: ""
  });
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, loading } = useAuth();
  
  const { isAdmin } = useIsAdmin();
  const { toast } = useToast();

  // Check if user already completed onboarding
  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    
    const checkOnboardingStatus = async () => {
      if (!user) {
        if (isMounted) setCheckingOnboarding(false);
        return;
      }

      try {
        const { data: existingResponse, error } = await supabase
          .from('onboarding_responses')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!isMounted) return;

        if (existingResponse && !error && !isAdmin) {
          // User already completed onboarding, redirect to dashboard with small delay
          timeoutId = setTimeout(() => {
            if (isMounted) window.location.href = "/dashboard";
          }, 100);
        } else {
          setCheckingOnboarding(false);
        }
      } catch (error) {
        console.error('Error checking onboarding:', error);
        if (isMounted) setCheckingOnboarding(false);
      }
    };

    if (!loading) {
      // Small delay to prevent race conditions
      timeoutId = setTimeout(() => {
        if (isMounted) checkOnboardingStatus();
      }, 50);
    }
    
    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [user, loading, isAdmin]);

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
    if (currentQuestion < 10) {
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

    // Admin preview mode: don't save, just redirect back
    if (isAdmin) {
      toast({
        title: "Modo visualização",
        description: "Respostas não foram salvas (modo admin)."
      });
      window.location.href = "/dashboard";
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('onboarding_responses')
        .insert({
          user_id: user.id,
          age: data.age,
          gender: data.gender,
          cigarettes_per_day: data.cigarettesPerDay ? parseInt(data.cigarettesPerDay, 10) : null,
          vapes_per_month: data.vapesPerMonth ? parseInt(data.vapesPerMonth, 10) : null,
          smoking_types: data.smokingTypes,
          smoking_reasons: data.smokingReasons,
          smoking_fears: data.smokingFears,
          weekly_cost: data.weeklyCost
        } as any);

      if (error) throw error;

      // v2: guarda respostas completas + jornada inicial
      const jornada = data.journeyType === "abstinencia" ? "abstinencia" : "reducao";
      const habitos_selecionados = selectedHabitos(
        data.habitEmotions,
        data.habitMoments,
        data.habitSubstances
      );
      const { error: v2Error } = await supabase
        .from('onboarding_responses_v2')
        .insert({
          user_id: user.id,
          email: user.email ?? null,
          respostas: {
            age: data.age,
            gender: data.gender,
            cigarettesPerDay: data.cigarettesPerDay,
            vapesPerMonth: data.vapesPerMonth,
            smokingTypes: data.smokingTypes,
            smokingReasons: data.smokingReasons,
            smokingFears: data.smokingFears,
            weeklyCost: data.weeklyCost,
            habitEmotions: data.habitEmotions,
            habitMoments: data.habitMoments,
            habitSubstances: data.habitSubstances,
            habitosSelecionados: habitos_selecionados,
          },
          jornada_inicial: jornada,
        } as any);
      if (v2Error) console.error('Error saving onboarding v2:', v2Error);

      // Cria primeira linha de histórico de jornada
      const { error: histError } = await supabase
        .from('historico_jornada_usuario')
        .insert({
          user_id: user.id,
          jornada,
        } as any);
      if (histError) console.error('Error saving journey history:', histError);
      
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const questionComponents = {
    1: <IntroScreen onNext={nextQuestion} />,
    2: <Question1 data={data} updateData={updateData} onNext={nextQuestion} />,
    3: <Question2 data={data} updateData={updateData} onNext={nextQuestion} onPrev={prevQuestion} />,
    4: <Question5 data={data} updateData={updateData} onNext={nextQuestion} onPrev={prevQuestion} />,
    5: <Question3 data={data} updateData={updateData} onNext={nextQuestion} onPrev={prevQuestion} />,
    6: (
      <HabitCheckboxQuestion
        title="Em quais dessas situações você costuma fumar?"
        subtitle="Selecione todas que se aplicam"
        options={EMOTION_OPTIONS}
        selected={data.habitEmotions}
        onChange={(v) => updateData({ habitEmotions: v })}
        onNext={nextQuestion}
        onPrev={prevQuestion}
        step={5}
        total={8}
      />
    ),
    7: (
      <HabitCheckboxQuestion
        title="Em quais momentos você costuma fumar?"
        subtitle="Selecione todos que se aplicam"
        options={MOMENT_OPTIONS}
        selected={data.habitMoments}
        onChange={(v) => updateData({ habitMoments: v })}
        onNext={nextQuestion}
        onPrev={prevQuestion}
        step={6}
        total={8}
      />
    ),
    8: (
      <HabitCheckboxQuestion
        title="Com quais substâncias você costuma fumar junto?"
        subtitle="Selecione todas que se aplicam"
        options={SUBSTANCE_OPTIONS}
        selected={data.habitSubstances}
        onChange={(v) => updateData({ habitSubstances: v })}
        onNext={nextQuestion}
        onPrev={prevQuestion}
        step={7}
        total={8}
      />
    ),
    9: <Question7 data={data} updateData={updateData} onNext={nextQuestion} onPrev={prevQuestion} />,
    10: <CompletionScreen onFinish={finishOnboarding} isSubmitting={isSubmitting} />
  };

  return (
    <div className="min-h-screen">
      {questionComponents[currentQuestion as keyof typeof questionComponents]}
    </div>
  );
};

export default Onboarding;