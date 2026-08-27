import { Capacitor, registerPlugin } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";

interface AppleSignInPlugin {
  authorize(options: { nonce?: string }): Promise<{
    identityToken: string;
    user?: string;
    email?: string;
    givenName?: string;
    familyName?: string;
    authorizationCode?: string;
  }>;
}

// Plugin nativo local (ios/App/App/AppleSignInPlugin.swift)
const AppleSignIn = registerPlugin<AppleSignInPlugin>("AppleSignIn");

/** Apple é oferecido apenas no app nativo iOS. */
export const isAppleSignInAvailable = () =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";

const randomNonce = (length = 32) => {
  const charset = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-._";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => charset[b % charset.length]).join("");
};

const sha256Hex = async (value: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

export type AppleSignInResult = { error: any; canceled?: boolean };

/**
 * Fluxo nativo do Sign in with Apple (iOS).
 * Gera um nonce aleatório: o hash SHA-256 vai para a Apple (claim `nonce` do
 * identityToken) e o valor bruto vai para o Supabase, que refaz o hash e compara.
 */
export const signInWithApple = async (): Promise<AppleSignInResult> => {
  if (!isAppleSignInAvailable()) {
    return { error: new Error("apple_sign_in_unavailable") };
  }

  let identityToken: string;
  let rawNonce: string;

  try {
    rawNonce = randomNonce();
    const hashedNonce = await sha256Hex(rawNonce);
    const result = await AppleSignIn.authorize({ nonce: hashedNonce });
    identityToken = result?.identityToken;
    if (!identityToken) return { error: new Error("no_identity_token") };
  } catch (e: any) {
    const raw = `${e?.code ?? ""} ${e?.message ?? ""}`.toLowerCase();
    if (raw.includes("canceled") || raw.includes("cancelled") || raw.includes("1001")) {
      return { error: null, canceled: true };
    }
    return { error: e };
  }

  const { error } = await supabase.auth.signInWithIdToken({
    provider: "apple",
    token: identityToken,
    nonce: rawNonce,
  });

  return { error };
};
