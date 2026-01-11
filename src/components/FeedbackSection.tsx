import { FeedbackCard } from "./FeedbackCard";
import { feedbackQuestions } from "@/data/feedbackQuestions";
import { useAuth } from "@/hooks/useAuth";

interface FeedbackSectionProps {
  currentDay: number;
  showAllForPreview?: boolean;
  isDayCompleted: (day: number) => boolean;
}

export const FeedbackSection = ({ currentDay, showAllForPreview = false, isDayCompleted }: FeedbackSectionProps) => {
  const { session } = useAuth();

  if (!session?.user?.id) return null;

  // Validate feedbackQuestions is an array
  if (!Array.isArray(feedbackQuestions)) {
    console.error('feedbackQuestions is not an array');
    return null;
  }

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

  // Para usuários normais, mostrar apenas a pergunta do dia atual E apenas se o dia foi completado
  const todaysQuestion = feedbackQuestions.find((q) => q.day === currentDay);

  if (!todaysQuestion) return null;

  // Só mostra o feedback se o dia atual foi completado
  try {
    if (typeof isDayCompleted !== 'function' || !isDayCompleted(currentDay)) return null;
  } catch (error) {
    console.error('Error checking if day is completed:', error);
    return null;
  }

  return (
    <div className="space-y-4">
      <FeedbackCard question={todaysQuestion} userId={session.user.id} />
    </div>
  );
};
