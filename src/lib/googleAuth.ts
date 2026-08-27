import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";

// Custom URL scheme registered in iOS Info.plist and AndroidManifest
export const NATIVE_AUTH_REDIRECT = "app.sopro.neuro://auth-callback";

/**
 * Starts the Google OAuth flow.
 * Web: normal redirect back to the app origin.
 * Native (iOS/Android): opens the system browser and returns through a deep link,
 * which is handled by the listener registered in useGoogleDeepLink.
 */
export const signInWithGoogle = async (): Promise<{ error: any }> => {
  const isNative = Capacitor.isNativePlatform();

  if (isNative) {
    const { Browser } = await import("@capacitor/browser");

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: NATIVE_AUTH_REDIRECT,
        skipBrowserRedirect: true,
        queryParams: { prompt: "select_account" },
      },
    });

    if (error || !data?.url) return { error: error ?? new Error("no_oauth_url") };

    await Browser.open({ url: data.url, presentationStyle: "popover" });
    return { error: null };
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/`,
      queryParams: { prompt: "select_account" },
    },
  });

  return { error };
};
