// Mapeamento das opções do onboarding para os hábitos em habitos_jornada.habito_titulo
// Assim conseguimos derivar quais hábitos entram na jornada do usuário.

export const EMOTION_OPTIONS: { label: string; habito: string }[] = [
  { label: "Quando estou ansioso(a)", habito: "Fumar quando está ansioso" },
  { label: "Quando estou estressado(a)", habito: "Fumar quando está ansioso" },
  { label: "Quando estou com tédio", habito: "Fumar quando está com tédio" },
  { label: "Quando preciso me concentrar / focar", habito: "Fumar para focar" },
  { label: "Quando preciso ser produtivo(a)", habito: "Fumar para focar" },
  { label: "Para relaxar / descansar", habito: "Fumar para descansar" },
  { label: "Quando quero uma pausa no trabalho", habito: "Fumar para descansar" },
  { label: "Antes de encarar uma tarefa difícil", habito: "Fumar antes de tarefas" },
];

export const MOMENT_OPTIONS: { label: string; habito: string }[] = [
  { label: "Ao acordar", habito: "Fumar ao acordar" },
  { label: "Antes de dormir", habito: "Gatilhos automáticos do dia a dia" },
  { label: "Dirigindo", habito: "Gatilhos automáticos do dia a dia" },
  { label: "Depois do almoço / à tarde", habito: "Fumar após as refeições" },
  { label: "Enquanto trabalho", habito: "Fumar durante o trabalho" },
  { label: "Em festas ou eventos sociais", habito: "Fumar em situações sociais" },
  { label: "Vendo TV / séries / filmes", habito: "Gatilhos automáticos do dia a dia" },
  { label: "Jogando (videogame, celular)", habito: "Gatilhos automáticos do dia a dia" },
  { label: "Falando ao telefone", habito: "Gatilhos automáticos do dia a dia" },
];

export const SUBSTANCE_OPTIONS: { label: string; habito: string }[] = [
  { label: "Bebendo álcool", habito: "Fumar em situações sociais" },
  { label: "Tomando café", habito: "Fumar após o café" },
  { label: "Depois das refeições", habito: "Fumar após as refeições" },
  { label: "Outras", habito: "Gatilhos automáticos do dia a dia" },
  { label: "Nenhuma", habito: "" },
];

export function selectedHabitos(
  emotions: string[],
  moments: string[],
  substances: string[]
): string[] {
  const map = (opts: { label: string; habito: string }[], selected: string[]) =>
    opts
      .filter((o) => selected.includes(o.label) && o.habito)
      .map((o) => o.habito);
  return [
    ...map(EMOTION_OPTIONS, emotions),
    ...map(MOMENT_OPTIONS, moments),
    ...map(SUBSTANCE_OPTIONS, substances),
  ];
}