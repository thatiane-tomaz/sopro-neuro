import { supabase } from "@/integrations/supabase/client";

/**
 * Registro simples de eventos de funil (agregado por dia/página/botão em
 * public.button_clicks). Falha em silêncio: nunca deve quebrar a experiência.
 */
export const trackEvent = async (page: string, button: string) => {
  try {
    await supabase.rpc("increment_button_click", { _page: page, _button: button });
  } catch (e) {
    // silencioso de propósito
  }
};
