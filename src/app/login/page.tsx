import { redirect } from "next/navigation";
import LoginView from "./login-view";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const instant = false;

export default async function LoginRoute() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) console.error("Could not verify existing session on login page", error);
    if (user) redirect("/dashboard");
  }

  return <LoginView />;
}
