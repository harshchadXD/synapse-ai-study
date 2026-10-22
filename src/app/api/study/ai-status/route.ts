import { NextResponse } from "next/server";
import { getAIProviderStatus } from "@/lib/study/ai-provider";

export const maxDuration = 10;

export async function GET() {
  const status = getAIProviderStatus();
  return NextResponse.json(status);
}
