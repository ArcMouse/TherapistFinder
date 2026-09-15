import * as AuthSession from "expo-auth-session";
import Constants from "expo-constants";

const extra = (Constants.expoConfig?.extra ?? {}) as { googleClientId?: string };

export const GOOGLE_DISCOVERY = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
};

export function getGoogleClientId(): string {
  return process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? extra.googleClientId ?? "";
}

/**
 * Development/CI escape hatch: when no Google client is configured the flow can
 * still be exercised end-to-end by supplying a test ID token. Never set this in
 * production builds.
 */
export function getDevGoogleToken(): string | null {
  return process.env.EXPO_PUBLIC_GOOGLE_DEV_TOKEN ?? null;
}

export function makeGoogleRedirectUri(): string {
  return AuthSession.makeRedirectUri({ scheme: "mindease", path: "oauth" });
}

export function buildGoogleRequestConfig() {
  return {
    clientId: getGoogleClientId(),
    webClientId: getGoogleClientId(),
    responseType: AuthSession.ResponseType.IdToken,
    scopes: ["openid", "profile", "email"],
    redirectUri: makeGoogleRedirectUri(),
  };
}

export type GooglePromptResult =
  | { type: "success"; idToken: string }
  | { type: "cancel" }
  | { type: "error"; message: string };

/** Uses the browser-based Google OAuth flow to obtain an ID token. */
export async function promptGoogleIdToken(
  promptAsync: (options?: AuthSession.AuthRequestPromptOptions) => Promise<AuthSession.AuthSessionResult>
): Promise<GooglePromptResult> {
  const result = await promptAsync();
  if (result.type === "success") {
    const idToken = (result.params as Record<string, string>).id_token;
    if (idToken) return { type: "success", idToken };
    return { type: "error", message: "Google did not return an ID token." };
  }
  if (result.type === "cancel" || result.type === "dismiss") {
    return { type: "cancel" };
  }
  return { type: "error", message: "Google sign-in failed. Please try again." };
}