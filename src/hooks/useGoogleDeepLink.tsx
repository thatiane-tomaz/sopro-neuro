import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";

/**
 * Listens for the OAuth deep link (app.sopro.neuro://auth-callback?...)
 * on native builds, finishes the Supabase session and closes the in-app browser.
 * Also handles cold start via App.getLaunchUrl() when the app was fully closed.
 */
export const useGoogleDeepLink = () => {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let remove: (() => void) | undefined;
    // Track the last processed auth URL to avoid double-processing when
    // both getLaunchUrl() and appUrlOpen fire for the same deep link.
    let lastProcessedUrl: string | null = null;

    (async () => {
      const { App } = await import("@capacitor/app");
      const { Browser } = await import("@capacitor/browser");

      const processAuthUrl = async (url?: string | null) => {
        if (!url || !url.includes("auth-callback")) return;
        if (url === lastProcessedUrl) return;
        lastProcessedUrl = url;

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
      };

      const listener = await App.addListener("appUrlOpen", ({ url }) => {
        void processAuthUrl(url);
      });

      remove = () => listener.remove();

      // Cold start: app was killed and reopened by the deep link, so
      // appUrlOpen never fires — recover the launch URL here.
      try {
        const launch = await App.getLaunchUrl();
        if (launch?.url) {
          await processAuthUrl(launch.url);
        }
      } catch {
        // getLaunchUrl not critical; ignore failures
      }
    })();

    return () => {
      remove?.();
    };
  }, []);
};
