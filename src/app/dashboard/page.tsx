import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import DashboardHome from "./dashboard-home";

export const instant = false;

export default async function DashboardPage() {
  if (!isSupabaseConfigured()) redirect("/");

  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) redirect("/");


  const metadataName = user.user_metadata.full_name ?? user.user_metadata.name;
  const name =
    typeof metadataName === "string" && metadataName.trim()
      ? metadataName.trim()
      : user.email?.split("@")[0] ?? "Student";

  const avatarUrl = user.user_metadata.avatar_url ?? user.user_metadata.picture;

  return (
    <DashboardHome
      name={name}
      email={user.email ?? ""}
      provider={user.app_metadata.provider === "google" ? "Google" : "Email"}
      avatarUrl={avatarUrl}
    />
  );
}
