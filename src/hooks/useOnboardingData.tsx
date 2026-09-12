import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface OnboardingResponse {
  id: string;
  user_id: string;
  weekly_cost: string | null;
  weekly_cost_value: number | null;
  cigarettes_per_day: number | null;
  vapes_per_month: number | null;
  last_cigarette_date: string | null;
  age: string | null;
  gender: string | null;
  smoking_frequency: string | null;
  smoking_types: string[] | null;
  smoking_reasons: string[] | null;
  completed_at: string;
}

interface OnboardingResponseV2 {
  id: string;
  user_id: string;
  email: string | null;
  respostas: Record<string, unknown> | null;
  jornada_inicial: string;
  created_at: string;
  updated_at: string;
}

const parseNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

// Se passar de 999, assume que a pessoa digitou com centavos (ex.: "3500" = R$ 35,00)
const normalizeWeeklyCost = (n: number): number =>
  Number.isFinite(n) && n > 999 ? Math.round(n / 100) : n;

const parseMoneyValue = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return normalizeWeeklyCost(value);
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseFloat(value.replace(',', '.'));
    return Number.isFinite(parsed) ? normalizeWeeklyCost(parsed) : null;
  }
  return null;
};

const parseStringArray = (value: unknown): string[] | null => {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : null;
};

const isAfter = (left?: string | null, right?: string | null) => {
  if (!left) return false;
  if (!right) return true;
  return new Date(left).getTime() > new Date(right).getTime();
};

const mapV2ToOnboarding = (
  v2: OnboardingResponseV2,
  legacy: OnboardingResponse | null,
): OnboardingResponse => {
  const respostas = v2.respostas ?? {};
  const weeklyCost = typeof respostas.weeklyCost === 'string' ? respostas.weeklyCost : legacy?.weekly_cost ?? null;

  return {
    id: v2.id,
    user_id: v2.user_id,
    weekly_cost: weeklyCost,
    weekly_cost_value: parseMoneyValue(weeklyCost) ?? legacy?.weekly_cost_value ?? null,
    cigarettes_per_day: parseNumber(respostas.cigarettesPerDay) ?? legacy?.cigarettes_per_day ?? null,
    vapes_per_month: parseNumber(respostas.vapesPerMonth) ?? legacy?.vapes_per_month ?? null,
    last_cigarette_date: legacy?.last_cigarette_date ?? null,
    age: typeof respostas.age === 'string' ? respostas.age : legacy?.age ?? null,
    gender: typeof respostas.gender === 'string' ? respostas.gender : legacy?.gender ?? null,
    smoking_frequency: legacy?.smoking_frequency ?? null,
    smoking_types: parseStringArray(respostas.smokingTypes) ?? legacy?.smoking_types ?? null,
    smoking_reasons: parseStringArray(respostas.smokingReasons) ?? legacy?.smoking_reasons ?? null,
    completed_at: v2.created_at,
  };
};

export const useOnboardingData = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['onboarding_response', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      try {
        const nowIso = new Date().toISOString();
        const [legacyResult, v2Result] = await Promise.all([
          supabase
            .from('onboarding_responses')
            .select('*')
            .eq('user_id', user.id)
            .lte('completed_at', nowIso)
            .order('completed_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from('onboarding_responses_v2')
            .select('*')
            .eq('user_id', user.id)
            .lte('created_at', nowIso)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        if (legacyResult.error) {
          console.error('Error fetching onboarding data:', legacyResult.error);
        }
        if (v2Result.error) {
          console.error('Error fetching onboarding v2 data:', v2Result.error);
        }

        const legacy = (legacyResult.data ?? null) as OnboardingResponse | null;
        const v2 = (v2Result.data ?? null) as OnboardingResponseV2 | null;

        if (v2 && isAfter(v2.created_at, legacy?.completed_at)) {
          return mapV2ToOnboarding(v2, legacy);
        }

        if (legacy) {
          return legacy;
        }

        if (v2) {
          return mapV2ToOnboarding(v2, null);
        }

        if (legacyResult.error && v2Result.error) {
          return null;
        }

        return null;
      } catch (error) {
        console.error('Error in onboarding data query:', error);
        return null;
      }
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 1,
  });
};
