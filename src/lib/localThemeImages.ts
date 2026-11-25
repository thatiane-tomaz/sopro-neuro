import dia1 from "@/assets/intensivo/dia_1.webp";
import dia2 from "@/assets/intensivo/dia_2.webp";
import dia3 from "@/assets/intensivo/dia_3.webp";
import dia4 from "@/assets/intensivo/dia_4.webp";
import dia5 from "@/assets/intensivo/dia_5.webp";
import dia6 from "@/assets/intensivo/dia_6.webp";
import dia7 from "@/assets/intensivo/dia_7.webp";

/**
 * Imagens locais de temas, referenciadas em habitos_jornada.imagem_nome com o
 * prefixo "intensivo:". Ficam no bundle do app (Capacitor), sem depender de
 * links assinados do storage.
 */
const LOCAL_THEME_IMAGES: Record<string, string> = {
  "intensivo:dia_1.webp": dia1,
  "intensivo:dia_2.webp": dia2,
  "intensivo:dia_3.webp": dia3,
  "intensivo:dia_4.webp": dia4,
  "intensivo:dia_5.webp": dia5,
  "intensivo:dia_6.webp": dia6,
  "intensivo:dia_7.webp": dia7,
};

export function getLocalThemeImage(name: string | null | undefined): string | null {
  if (!name) return null;
  return LOCAL_THEME_IMAGES[name] ?? null;
}
