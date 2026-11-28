export type TourStep = {
  title: string;
  text: string;
  route: string;
  /** Vazio = apresenta a tela inteira, sem destaque. */
  targets: string[];
  /** next = botão Continuar; route = espera o toque que abre nextRoute */
  advance: "next" | "route";
  /** Allows browsing the page while the presentation remains open. */
  allowExplore?: boolean;
  nextRoute?: string;
  finishLabel?: string;
};

export const TOUR_INTRO = {
  title: "Quer descobrir como o Sopro te ajuda a parar de fumar?",
  text: "Um tour rápido pelo app.\nLeva menos de 1 minuto.",
};

export const TOUR_STEPS: TourStep[] = [
  { title: "Conteúdo de hoje", text: "De acordo com seu objetivo e gatilhos, indicamos o conteúdo que irá enfraquecer o vício aos poucos.", route: "/dashboard", targets: ['[data-tour="foco-hoje"]'], advance: "next" },
  { title: "Ajuda rápida", text: "A vontade apertou? Aqui tem uma hipnose para te ajudar agora.", route: "/dashboard", targets: ['[data-tour="sos"]'], advance: "next" },
  { title: "Neo", text: "Pode contar com o Neo. Você pode tirar dúvidas sobre o vício e pedir ajuda para conseguir superar a vontade de fumar.", route: "/dashboard", targets: ['[data-tour="neo-card"]'], advance: "next" },
  { title: "Abrir Jornadas", text: "Toque em Jornadas, aqui embaixo, para ver todos os conteúdos disponíveis que te ajudarão a parar de fumar.", route: "/dashboard", targets: ['[data-tour="nav-jornada"]'], advance: "route", nextRoute: "/jornada" },
  { title: "Suas jornadas", text: "Além do conteúdo indicado para hoje, você pode escolher outros gatilhos para enfraquecer e encontrar hipnoses que te ajudam a superar a abstinência.", route: "/jornada", targets: [], advance: "next", allowExplore: true },
  { title: "Abrir Progresso", text: "Agora toque em Progresso para acompanhar suas conquistas.", route: "/jornada", targets: ['[data-tour="nav-progresso"]'], advance: "route", nextRoute: "/progresso" },
  { title: "Acompanhar a evolução", text: "Registre diariamente quanto fumou e acompanhe sua evolução. Você também verá uma contagem de dias sem fumar.", route: "/progresso", targets: ['[data-tour="sem-fumar"]', '[data-tour="conquistas"]'], advance: "next" },
  { title: "Ver o potencial", text: "Veja quanto você pode economizar em um mês ou um ano sem fumar.", route: "/progresso", targets: ['[data-tour="potencial"]'], advance: "next" },
  { title: "Ritual do último cigarro", text: "Quando sentir que chegou a hora de parar de vez, marque aqui a data do seu último cigarro e comece a contar os dias como ex-fumante.", route: "/progresso", targets: ['[data-tour="ritual-btn"]'], advance: "next", finishLabel: "Começar o processo" },
];
