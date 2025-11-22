import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FeedbackData {
  day_number: number;
  question_type: string;
  response?: string;
  rating?: number;
  comment?: string;
}

export const useFeedback = (userId: string | undefined) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: feedbackData } = useQuery({
    queryKey: ["feedback", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("feedback_responses")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });

  const submitFeedback = useMutation({
    mutationFn: async (feedback: FeedbackData) => {
      if (!userId) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("feedback_responses")
        .insert({
          user_id: userId,
          ...feedback,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback", userId] });
      toast({
        title: "Obrigado!",
        description: "Sua resposta foi enviada com sucesso.",
      });
    },
    onError: (error) => {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar sua resposta. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const hasFeedbackForDay = (day: number) => {
    return feedbackData?.some((f) => f.day_number === day) || false;
  };

  return {
    feedbackData,
    submitFeedback,
    hasFeedbackForDay,
  };
};
