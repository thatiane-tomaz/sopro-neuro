import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface SmokingLog {
  id: string;
  user_id: string;
  log_date: string; // YYYY-MM-DD
  cigarettes_count: number;
  created_at: string;
  updated_at: string;
}

export const useSmokingLogs = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["daily_smoking_logs", user?.id],
    queryFn: async () => {
      if (!user?.id) return [] as SmokingLog[];
      const { data, error } = await supabase
        .from("daily_smoking_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("log_date", { ascending: true });
      if (error) {
        console.error("Error fetching smoking logs:", error);
        return [] as SmokingLog[];
      }
      return (data || []) as SmokingLog[];
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000,
  });

  const upsert = useMutation({
    mutationFn: async ({
      logDate,
      count,
    }: {
      logDate: string;
      count: number;
    }) => {
      if (!user?.id) throw new Error("not authenticated");
      const { error } = await supabase
        .from("daily_smoking_logs")
        .upsert(
          {
            user_id: user.id,
            log_date: logDate,
            cigarettes_count: Math.max(0, Math.floor(count)),
          },
          { onConflict: "user_id,log_date" },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["daily_smoking_logs", user?.id] });
    },
  });

  return {
    logs: query.data ?? [],
    isLoading: query.isLoading,
    upsert: upsert.mutateAsync,
    isSaving: upsert.isPending,
  };
};

// Helpers exported for shared use
export const toLocalDateStr = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const yesterdayStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toLocalDateStr(d);
};