import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import ChatOnboarding from "@/components/onboarding/ChatOnboarding";
import BuildingJourneyScreen from "@/components/onboarding/BuildingJourneyScreen";
import { selectedHabitos } from "@/components/onboarding/habitOptions";

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
  const [isBuilding, setIsBuilding] = useState(false);
  const [saveDone, setSaveDone] = useState(false);
  const [animDone, setAnimDone] = useState(false);
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

  // Redirect only when both the animation and the saving finished
  useEffect(() => {
    if (isBuilding && saveDone && animDone) {
      window.location.href = "/dashboard";
    }
  }, [isBuilding, saveDone, animDone]);

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

  const finishOnboarding = async () => {
    if (!user) return;

    setIsSubmitting(true);
    setIsBuilding(true);
    
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
      
      setSaveDone(true);
    } catch (error) {
      console.error('Error saving onboarding:', error);
      setIsBuilding(false);
      toast({
        title: "Erro",
        description: "Erro ao salvar suas respostas. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isBuilding) {
    return (
      <BuildingJourneyScreen
        journeyType={data.journeyType}
        onDone={() => setAnimDone(true)}
      />
    );
  }

  return (
    <div className="min-h-screen">
      <ChatOnboarding
        data={data}
        updateData={updateData}
        onFinish={finishOnboarding}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default Onboarding;