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
      
      try {
        const { data, error } = await supabase
          .from("feedback_responses")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (error) {
          console.error('Error fetching feedback:', error);
          return [];
        }
        return data || [];
      } catch (error) {
        console.error('Error in feedback query:', error);
        return [];
      }
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
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
    if (!Array.isArray(feedbackData)) return false;
    return feedbackData.some((f) => f.day_number === day);
  };

  return {
    feedbackData,
    submitFeedback,
    hasFeedbackForDay,
  };
};
