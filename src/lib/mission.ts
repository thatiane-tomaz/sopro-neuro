export interface MissionCopy {
  missao_principal?: string | null;
  missao_secundaria?: string | null;
  explicacao_missao?: string | null;
}

export function getMissionCopy(mission: MissionCopy) {
  const primary = mission.missao_principal?.trim() || mission.explicacao_missao?.trim() ||
    "Observe esse hábito nos próximos dias: em quais momentos ele aparece e o que você sente.";
  const secondary = mission.missao_secundaria?.trim() || "";
  return { primary, secondary, full: [primary, secondary].filter(Boolean).join("\n\n") };
}

export function shouldOpenMissionAfterHypnosis(contentType: string, ended: boolean, hasMission: boolean) {
  return contentType === "hypnosis" && ended && hasMission;
}