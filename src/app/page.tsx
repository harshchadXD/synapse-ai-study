import { redirect } from "next/navigation";
import LandingClient from "./landing-client";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const instant = false;

export default async function HomePage() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error && !error.message.includes("Auth session missing")) console.error("Could not verify existing session on landing page", error);
    if (user) redirect("/dashboard");
  }

  return <LandingClient />;
}
