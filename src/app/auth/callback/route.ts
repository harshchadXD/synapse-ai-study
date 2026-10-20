import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

function redirectWithAuthError(request: NextRequest, code: string, message?: string) {
  const destination = new URL("/", request.url);
  destination.searchParams.set("authError", code);

  if (message) {
    destination.searchParams.set("authMessage", message.slice(0, 240));
  }

  return NextResponse.redirect(destination);
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const origin = request.nextUrl.origin;
  const providerError = searchParams.get("error");

  if (providerError) {
    const description = searchParams.get("error_description");
    const message = description
      ? `${providerError}: ${description}`
      : `Google sign-in returned "${providerError}".`;
    return redirectWithAuthError(request, "provider", message);
  }

  if (!isSupabaseConfigured()) {
    return redirectWithAuthError(
      request,
      "configuration",
      "Supabase environment variables are missing. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  const code = searchParams.get("code");
  if (!code) {
    return redirectWithAuthError(
      request,
      "missing_code",
      "Supabase returned to the app without an authorization code. Check the Google OAuth callback URL and Supabase redirect URL allowlist.",
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Supabase OAuth code exchange failed", {
      code: error.code,
      status: error.status,
      message: error.message,
    });
    return redirectWithAuthError(request, "exchange", error.message);
  }

  const requestedPath = searchParams.get("next");
  const next =
    requestedPath && requestedPath.startsWith("/") && !requestedPath.startsWith("//")
      ? requestedPath
      : "/dashboard";
  const destination = new URL(next, origin);

  if (destination.origin !== origin) {
    return NextResponse.redirect(new URL("/dashboard", origin));
  }

  return NextResponse.redirect(destination);
}
