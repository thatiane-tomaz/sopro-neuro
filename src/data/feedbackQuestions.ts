export interface FeedbackQuestion {
  day: number;
  type: string;
  question: string;
  responseType: "single" | "scale";
  options?: string[];
  scaleLabelLow?: string;
  scaleLabelHigh?: string;
}

export const feedbackQuestions: FeedbackQuestion[] = [
  {
    day: 1,
    type: "clarity",
    question: "O processo dos próximos dias está claro e faz sentido para você?",
    responseType: "single",
    options: ["Está claro", "Está parcialmente claro", "Não está claro"],
  },
  {
    day: 5,
    type: "experience",
    question: "Como tem sido sua experiência com o Sopro até aqui?",
    responseType: "single",
    options: ["Excelente", "Boa", "Neutra", "Ruim", "Muito ruim"],
  },
  {
    day: 7,
    type: "motivation",
    question: "Como está seu nível de motivação e confiança para parar de fumar hoje?",
    responseType: "scale",
  },
  {
    day: 10,
    type: "pmf",
    question: "Como você se sentiria se não pudesse mais usar o Sopro daqui pra frente?",
    responseType: "single",
    options: [
      "Muito desapontado",
      "Um pouco desapontado",
      "Não ficaria desapontado",
      "Não uso mais o Sopro",
    ],
  },
  {
    day: 14,
    type: "nps",
    question: "De 0 a 10, qual a chance de você recomendar o Sopro para alguém que quer parar de fumar?",
    responseType: "scale",
  },
];
