// Mapeamento das opções do onboarding para os hábitos em habitos_jornada.habito_titulo
// Assim conseguimos derivar quais hábitos entram na jornada do usuário.

export const EMOTION_OPTIONS: { label: string; habito: string }[] = [
  { label: "Quando estou ansioso(a)", habito: "Fumar quando está ansioso" },
  { label: "Quando estou estressado(a)", habito: "Fumar quando está estressado" },
  { label: "Quando estou com tédio", habito: "Fumar quando está com tédio" },
  { label: "Quando preciso me concentrar / focar", habito: "Fumar quando precisa focar" },
  { label: "Quando preciso ser produtivo(a)", habito: "Fumar quando precisa ser produtivo" },
  { label: "Para relaxar / descansar", habito: "Fumar para descansar" },
  { label: "Antes de encarar uma tarefa difícil", habito: "Fumar antes de tarefas" },
];

export const MOMENT_OPTIONS: { label: string; habito: string }[] = [
  { label: "Ao acordar", habito: "Fumar ao acordar" },
  { label: "Antes de dormir", habito: "Fumar antes de dormir" },
  { label: "Dirigindo", habito: "Fumar dirigindo" },
  { label: "Enquanto trabalho", habito: "Fumar enquanto trabalha" },
  { label: "No intervalo do trabalho", habito: "Fumar no intervalo do trabalho" },
  { label: "Em festas ou eventos sociais", habito: "Fumar durante festas" },
  { label: "Vendo TV / séries / filmes", habito: "Fumar vendo TV" },
  { label: "Jogando (videogame, celular)", habito: "Fumar jogando" },
  { label: "Falando ao telefone", habito: "Fumar falando ao telefone" },
];

export const SUBSTANCE_OPTIONS: { label: string; habito: string }[] = [
  { label: "Bebendo álcool", habito: "Fumar enquanto bebe álcool" },
  { label: "Tomando café", habito: "Fumar após o café" },
  { label: "Depois das refeições", habito: "Fumar após as refeições" },
];

export function selectedHabitos(
  emotions: string[],
  moments: string[],
  substances: string[]
): string[] {
  const map = (opts: { label: string; habito: string }[], selected: string[]) =>
    opts.filter((o) => selected.includes(o.label)).map((o) => o.habito);
  return [
    ...map(EMOTION_OPTIONS, emotions),
    ...map(MOMENT_OPTIONS, moments),
    ...map(SUBSTANCE_OPTIONS, substances),
  ];
}