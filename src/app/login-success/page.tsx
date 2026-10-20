import { redirect } from "next/navigation";

export default function LoginSuccessPage() {
  redirect("/dashboard");
}
