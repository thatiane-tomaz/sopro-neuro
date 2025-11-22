import { FeedbackCard } from "./FeedbackCard";
import { feedbackQuestions } from "@/data/feedbackQuestions";
import { useAuth } from "@/hooks/useAuth";

interface FeedbackSectionProps {
  currentDay: number;
  showAllForPreview?: boolean;
}

export const FeedbackSection = ({ currentDay, showAllForPreview = false }: FeedbackSectionProps) => {
  const { session } = useAuth();

  if (!session?.user?.id) return null;

  // Para preview, mostrar todas as perguntas
  if (showAllForPreview) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Preview de Feedbacks (apenas visível para você)</h2>
        {feedbackQuestions.map((question) => (
          <FeedbackCard key={question.day} question={question} userId={session.user.id} />
        ))}
      </div>
    );
  }

  // Para usuários normais, mostrar apenas a pergunta do dia atual
  const todaysQuestion = feedbackQuestions.find((q) => q.day === currentDay);

  if (!todaysQuestion) return null;

  return (
    <div className="space-y-4">
      <FeedbackCard question={todaysQuestion} userId={session.user.id} />
    </div>
  );
};
