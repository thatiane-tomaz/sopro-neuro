import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFeedback } from "@/hooks/useFeedback";
import { FeedbackQuestion } from "@/data/feedbackQuestions";

interface FeedbackCardProps {
  question: FeedbackQuestion;
  userId: string;
}

export const FeedbackCard = ({ question, userId }: FeedbackCardProps) => {
  const [selectedResponse, setSelectedResponse] = useState<string>("");
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const { submitFeedback, hasFeedbackForDay } = useFeedback(userId);

  const alreadyAnswered = hasFeedbackForDay(question.day);

  const handleSubmit = () => {
    if (question.responseType === "single" && !selectedResponse) return;
    if (question.responseType === "scale" && rating === null) return;

    submitFeedback.mutate({
      day_number: question.day,
      question_type: question.type,
      response: question.responseType === "single" ? selectedResponse : undefined,
      rating: question.responseType === "scale" ? rating : undefined,
      comment: comment.trim() || undefined,
    });
  };

  if (alreadyAnswered) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-card/50 backdrop-blur">
      <CardHeader>
        <CardDescription className="text-base">{question.question}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {question.responseType === "single" && question.options && (
          <RadioGroup value={selectedResponse} onValueChange={setSelectedResponse}>
            {question.options.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${question.type}-${option}`} />
                <Label htmlFor={`${question.type}-${option}`} className="cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}

        {question.responseType === "scale" && (
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>0</span>
              <span>10</span>
            </div>
            <div className="grid grid-cols-11 gap-2">
              {Array.from({ length: 11 }, (_, i) => (
                <Button
                  key={i}
                  variant={rating === i ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRating(i)}
                  className="h-10"
                >
                  {i}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor={`comment-${question.type}`}>Nos ajude a melhorar:</Label>
          <Textarea
            id={`comment-${question.type}`}
            placeholder="Seu comentário (opcional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[80px]"
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={
            submitFeedback.isPending ||
            (question.responseType === "single" && !selectedResponse) ||
            (question.responseType === "scale" && rating === null)
          }
          className="w-full"
        >
          {submitFeedback.isPending ? "Enviando..." : "Enviar resposta"}
        </Button>
      </CardContent>
    </Card>
  );
};
