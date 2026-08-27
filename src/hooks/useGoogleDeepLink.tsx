import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";

/**
 * Listens for the OAuth deep link (app.sopro.neuro://auth-callback?...)
 * on native builds, finishes the Supabase session and closes the in-app browser.
 */
export const useGoogleDeepLink = () => {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let remove: (() => void) | undefined;

    (async () => {
      const { App } = await import("@capacitor/app");
      const { Browser } = await import("@capacitor/browser");

      const listener = await App.addListener("appUrlOpen", async ({ url }) => {
        if (!url?.includes("auth-callback")) return;

        try {
          const parsed = new URL(url);
          const code = parsed.searchParams.get("code");
          const hash = new URLSearchParams(parsed.hash.replace(/^#/, ""));
          const accessToken = hash.get("access_token");
          const refreshToken = hash.get("refresh_token");

          if (code) {
            await supabase.auth.exchangeCodeForSession(code);
          } else if (accessToken && refreshToken) {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
          }
        } catch (e) {
          console.error("Error finishing Google sign in:", e);
        } finally {
          Browser.close().catch(() => {});
        }
      });

      remove = () => listener.remove();
    })();

    return () => {
      remove?.();
    };
  }, []);
};
