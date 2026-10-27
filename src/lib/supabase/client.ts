import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./config";

const GOOGLE_ACCESS_TOKEN_KEY = "synapse_google_access_token";
const GOOGLE_REFRESH_TOKEN_KEY = "synapse_google_refresh_token";
let providerTokenListenerAttached = false;

export function createClient() {
  const { url, key } = getSupabaseConfig();
  const client = createBrowserClient(url, key);
  if (typeof window !== "undefined" && !providerTokenListenerAttached) {
    providerTokenListenerAttached = true;
    client.auth.onAuthStateChange((event, session) => {
      try {
        if (event === "SIGNED_OUT") {
          localStorage.removeItem(GOOGLE_ACCESS_TOKEN_KEY);
          localStorage.removeItem(GOOGLE_REFRESH_TOKEN_KEY);
          return;
        }
        if (session?.provider_token) {
          localStorage.setItem(GOOGLE_ACCESS_TOKEN_KEY, session.provider_token);
        }
        if (session?.provider_refresh_token) {
          localStorage.setItem(GOOGLE_REFRESH_TOKEN_KEY, session.provider_refresh_token);
        }
      } catch (error) {
        console.warn("Could not store Google OAuth tokens:", error);
      }
    });
  }
  return client;
}

export async function getGoogleProviderTokens() {
  const { data, error } = await createClient().auth.getSession();
  if (error) throw error;

  return {
    accessToken:
      data.session?.provider_token ??
      localStorage.getItem(GOOGLE_ACCESS_TOKEN_KEY),
    refreshToken:
      data.session?.provider_refresh_token ??
      localStorage.getItem(GOOGLE_REFRESH_TOKEN_KEY),
    isGoogleAccount:
      data.session?.user.app_metadata.provider === "google" ||
      data.session?.user.identities?.some((identity) => identity.provider === "google") === true,
  };
}

export function saveGoogleProviderTokens(accessToken: string, refreshToken?: string) {
  localStorage.setItem(GOOGLE_ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) {
    localStorage.setItem(GOOGLE_REFRESH_TOKEN_KEY, refreshToken);
  }
}
