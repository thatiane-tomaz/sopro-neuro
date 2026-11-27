export const TOUR_STORAGE_KEY = "sopro_tour_v1";

export type TourStep = {
  title: string;
  text: string;
  route: string;
  targets: string[];
  /** next = botão Continuar; route = espera o toque que abre nextRoute; reveal = espera rolar até o alvo */
  advance: "next" | "route" | "reveal";
  nextRoute?: string;
  bubbleTop?: boolean;
  finishLabel?: string;
};

export const TOUR_STEPS: TourStep[] = [
  { title: "Conteúdo de hoje", text: "Seu passo de hoje leva em conta seu momento e seu objetivo.", route: "/dashboard", targets: ['[data-tour="foco-hoje"]'], advance: "next" },
  { title: "Ajuda rápida", text: "A vontade apertou? Aqui tem uma hipnose para te ajudar agora.", route: "/dashboard", targets: ['[data-tour="sos"]'], advance: "next" },
  { title: "Neo", text: "Pode contar com o Neo. Ele te escuta e te ajuda a encontrar o próximo passo.", route: "/dashboard", targets: ['[data-tour="neo-input"]'], advance: "next" },
  { title: "Abrir Jornadas", text: "Toque em Jornadas para conhecer seus gatilhos.", route: "/dashboard", targets: ['[data-tour="jornadas-btn"]'], advance: "route", nextRoute: "/jornada" },
  { title: "Rolar para ver os gatilhos", text: "Role para baixo até ‘Enfraquecendo o vício’.", route: "/jornada", targets: ['[data-tour="journey-reducao"] [data-tour-card="1"]'], advance: "reveal", bubbleTop: true },
  { title: "Escolher um gatilho", text: "Esses gatilhos vêm do que você contou. Você escolhe qual quer enfraquecer primeiro.", route: "/jornada", targets: ['[data-tour="journey-reducao"] [data-tour-card="1"]'], advance: "next" },
  { title: "Abrir Progresso", text: "Toque em Progresso para acompanhar suas conquistas.", route: "/jornada", targets: ['[data-tour="nav-progresso"]'], advance: "route", nextRoute: "/progresso" },
  { title: "Acompanhar a evolução", text: "Veja quantos cigarros você evitou e quanto economizou. Cada dia registrado com zero cigarros entra na sua contagem.", route: "/progresso", targets: ['[data-tour="sem-fumar"]', '[data-tour="conquistas"]'], advance: "next" },
  { title: "Ver o potencial", text: "Veja quanto você pode economizar em um mês ou um ano sem fumar.", route: "/progresso", targets: ['[data-tour="potencial"]'], advance: "next" },
  { title: "Ritual do último cigarro", text: "Quando sentir que chegou a hora, marque aqui a data do seu último cigarro.", route: "/progresso", targets: ['[data-tour="ritual-btn"]'], advance: "next", finishLabel: "Começar o processo" },
];
