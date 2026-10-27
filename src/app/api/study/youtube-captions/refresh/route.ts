import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const maxDuration = 10;

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Google token refresh requires Supabase authentication to be configured.", code: "AUTH_NOT_CONFIGURED" },
      { status: 503 },
    );
  }
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json(
        { error: "Sign in before refreshing Google access.", code: "AUTH_REQUIRED" },
        { status: 401 },
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Could not verify your session. Please sign in again.", code: "AUTH_REQUIRED" },
      { status: 401 },
    );
  }

  let refreshToken: unknown;
  try {
    ({ refresh_token: refreshToken } = (await request.json()) as { refresh_token?: unknown });
  } catch {
    return NextResponse.json({ error: "Send a valid Google refresh token." }, { status: 400 });
  }
  if (typeof refreshToken !== "string" || !refreshToken.trim() || refreshToken.length > 4096) {
    return NextResponse.json(
      { error: "Reconnect Google to refresh YouTube access.", code: "GOOGLE_REAUTH_REQUIRED" },
      { status: 401 },
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Google token refresh is not configured on the server.", code: "GOOGLE_OAUTH_NOT_CONFIGURED" },
      { status: 503 },
    );
  }

  let response: Response;
  try {
    response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(7000),
    });
  } catch {
    return NextResponse.json(
      { error: "Google timed out while refreshing access. Please retry.", code: "GOOGLE_REFRESH_TIMEOUT" },
      { status: 504 },
    );
  }

  const result = (await response.json().catch(() => null)) as
    | { access_token?: string; refresh_token?: string; error?: string }
    | null;
  if (!response.ok || !result?.access_token) {
    const reauthorizationRequired = result?.error === "invalid_grant" || result?.error === "invalid_client";
    return NextResponse.json(
      {
        error: reauthorizationRequired
          ? "Reconnect Google to restore YouTube access."
          : "Google could not refresh YouTube access. Please retry.",
        code: reauthorizationRequired ? "GOOGLE_REAUTH_REQUIRED" : "GOOGLE_REFRESH_FAILED",
      },
      { status: reauthorizationRequired ? 401 : 502 },
    );
  }

  return NextResponse.json(
    {
      access_token: result.access_token,
      refresh_token: result.refresh_token,
      expires_in: 3600,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
