export const TOUR_STORAGE_KEY = "sopro_tour_v1";

export type TourStep = {
  title: string;
  text: string;
  route: string;
  /** Vazio = apresenta a tela inteira, sem destaque. */
  targets: string[];
  /** next = botão Continuar; route = espera o toque que abre nextRoute */
  advance: "next" | "route";
  nextRoute?: string;
  finishLabel?: string;
};

export const TOUR_INTRO = {
  title: "Quer descobrir como o Sopro te ajuda a parar de fumar?",
  text: "Um tour rápido pelo app. Leva menos de 1 minuto.",
};

export const TOUR_STEPS: TourStep[] = [
  { title: "Conteúdo de hoje", text: "De acordo com seu objetivo e gatilhos, indicamos o conteúdo que irá enfraquecer o vício aos poucos.", route: "/dashboard", targets: ['[data-tour="foco-hoje"]'], advance: "next" },
  { title: "Ajuda rápida", text: "A vontade apertou? Aqui tem uma hipnose para te ajudar agora.", route: "/dashboard", targets: ['[data-tour="sos"]'], advance: "next" },
  { title: "Neo", text: "Pode contar com o Neo. Ele te escuta e te ajuda a encontrar o próximo passo.", route: "/dashboard", targets: ['[data-tour="neo-card"]'], advance: "next" },
  { title: "Abrir Jornadas", text: "Toque em Jornadas, aqui embaixo, para conhecer seus gatilhos.", route: "/dashboard", targets: ['[data-tour="nav-jornada"]'], advance: "route", nextRoute: "/jornada" },
  { title: "Suas jornadas", text: "Aqui ficam todos os temas do método. Além do conteúdo indicado para hoje, você pode enfraquecer qualquer outro gatilho quando sentir que precisa.", route: "/jornada", targets: [], advance: "next" },
  { title: "Abrir Progresso", text: "Agora toque em Progresso para acompanhar suas conquistas.", route: "/jornada", targets: ['[data-tour="nav-progresso"]'], advance: "route", nextRoute: "/progresso" },
  { title: "Acompanhar a evolução", text: "Registre diariamente quanto fumou e acompanhe sua evolução. Você também verá uma contagem de dias sem fumar.", route: "/progresso", targets: ['[data-tour="sem-fumar"]', '[data-tour="conquistas"]'], advance: "next" },
  { title: "Ver o potencial", text: "Veja quanto você pode economizar em um mês ou um ano sem fumar.", route: "/progresso", targets: ['[data-tour="potencial"]'], advance: "next" },
  { title: "Ritual do último cigarro", text: "Quando sentir que chegou a hora, marque aqui a data do seu último cigarro.", route: "/progresso", targets: ['[data-tour="ritual-btn"]'], advance: "next", finishLabel: "Começar o processo" },
];
