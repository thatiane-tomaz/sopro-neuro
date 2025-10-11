// Journey configuration data
export interface DayContent {
  day: number;
  title: string;
  videoMinutes: number;
  hypnosisMinutes: number;
}

export interface PhaseData {
  id: number;
  title: string;
  subtitle: string;
  days: DayContent[];
}

export const journeyPhases: PhaseData[] = [
  {
    id: 1,
    title: "Fase 1",
    subtitle: "Despertar Interior",
    days: [
      { day: 1, title: "Dia 1", videoMinutes: 15, hypnosisMinutes: 20 },
      { day: 2, title: "Dia 2", videoMinutes: 15, hypnosisMinutes: 20 },
      { day: 3, title: "Dia 3", videoMinutes: 15, hypnosisMinutes: 20 },
      { day: 4, title: "Dia 4", videoMinutes: 15, hypnosisMinutes: 20 },
      { day: 5, title: "Dia 5", videoMinutes: 15, hypnosisMinutes: 20 },
      { day: 6, title: "Dia 6", videoMinutes: 15, hypnosisMinutes: 20 },
      { day: 7, title: "Dia 7", videoMinutes: 15, hypnosisMinutes: 20 },
    ]
  },
  {
    id: 2,
    title: "Fase 2",
    subtitle: "Transformação Profunda",
    days: [
      { day: 8, title: "Dia 8", videoMinutes: 15, hypnosisMinutes: 20 },
      { day: 9, title: "Dia 9", videoMinutes: 15, hypnosisMinutes: 20 },
      { day: 10, title: "Dia 10", videoMinutes: 15, hypnosisMinutes: 20 },
      { day: 11, title: "Dia 11", videoMinutes: 15, hypnosisMinutes: 20 },
      { day: 12, title: "Dia 12", videoMinutes: 15, hypnosisMinutes: 20 },
      { day: 13, title: "Dia 13", videoMinutes: 15, hypnosisMinutes: 20 },
      { day: 14, title: "Dia 14", videoMinutes: 15, hypnosisMinutes: 20 },
    ]
  },
  {
    id: 3,
    title: "Fase 3",
    subtitle: "Integração e Renovação",
    days: [
      { day: 15, title: "Dia 15", videoMinutes: 15, hypnosisMinutes: 20 },
      { day: 16, title: "Dia 16", videoMinutes: 15, hypnosisMinutes: 20 },
      { day: 17, title: "Dia 17", videoMinutes: 15, hypnosisMinutes: 20 },
      { day: 18, title: "Dia 18", videoMinutes: 15, hypnosisMinutes: 20 },
      { day: 19, title: "Dia 19", videoMinutes: 15, hypnosisMinutes: 20 },
      { day: 20, title: "Dia 20", videoMinutes: 15, hypnosisMinutes: 20 },
      { day: 21, title: "Dia 21", videoMinutes: 15, hypnosisMinutes: 20 },
    ]
  }
];
