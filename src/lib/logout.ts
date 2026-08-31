import { supabase } from "@/integrations/supabase/client";

/**
 * Logout resiliente para app nativo/web.
 * Em rede instável o signOut global pode travar, então garantimos
 * a limpeza local da sessão e a ida para a tela de login.
 */
export const performLogout = async (navigate?: (path: string, opts?: { replace?: boolean }) => void) => {
  try {
    await Promise.race([
      supabase.auth.signOut({ scope: "local" }),
      new Promise((resolve) => setTimeout(resolve, 2500)),
    ]);
  } catch {
    // ignore
  }

  // Limpeza defensiva de qualquer token remanescente
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith("sb-") || k.includes("supabase.auth"))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }

  if (navigate) {
    navigate("/login", { replace: true });
  } else {
    window.location.href = "/login";
  }
};
