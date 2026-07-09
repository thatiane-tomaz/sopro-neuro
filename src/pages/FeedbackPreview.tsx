import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { feedbackQuestions } from "@/data/feedbackQuestions";

const FeedbackPreview = () => {
  const [selectedResponses, setSelectedResponses] = useState<Record<number, string>>({});
  const [ratings, setRatings] = useState<Record<number, number | null>>({});

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      <h1 className="text-2xl font-bold text-center text-foreground">Preview: Feedback Cards</h1>
      <p className="text-center text-muted-foreground text-sm">Assim que o usuário completa o conteúdo do dia, o card aparece no topo do Dashboard.</p>
      
      {feedbackQuestions.map((question) => (
        <Card key={question.day} className="border-primary/20 bg-card/50 backdrop-blur max-w-md mx-auto">
          <CardHeader>
            <p className="text-xs font-semibold text-primary">Dia {question.day} · {question.type}</p>
            <CardDescription className="text-base">{question.question}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {question.responseType === "single" && question.options && (
              <RadioGroup
                value={selectedResponses[question.day] || ""}
                onValueChange={(val) => setSelectedResponses((prev) => ({ ...prev, [question.day]: val }))}
              >
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
                  <span>{question.scaleLabelLow || "0"}</span>
                  <span>{question.scaleLabelHigh || "10"}</span>
                </div>
                <div className="grid grid-cols-11 gap-1">
                  {Array.from({ length: 11 }, (_, i) => (
                    <Button
                      key={i}
                      variant={ratings[question.day] === i ? "default" : "outline"}
                      size="sm"
                      onClick={() => setRatings((prev) => ({ ...prev, [question.day]: i }))}
                      className="h-10 px-0"
                    >
                      {i}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Nos ajude a melhorar:</Label>
              <Textarea placeholder="Seu comentário (opcional)" className="min-h-[80px]" />
            </div>

            <Button className="w-full">Enviar resposta</Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default FeedbackPreview;
