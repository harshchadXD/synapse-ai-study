"use client";

import { useRouter } from "next/navigation";
import { LoginPage } from "../landing-client";

export default function LoginView() {
  const router = useRouter();
  return <LoginPage onBack={() => router.replace("/")} />;
}
