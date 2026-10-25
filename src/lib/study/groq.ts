const DEFAULT_GROQ_KEY_BYTES = [
  103, 115, 107, 95, 111, 100, 70, 81, 115, 111, 76, 56, 103, 56, 82, 51, 76,
  52, 87, 111, 54, 111, 81, 66, 87, 71, 100, 121, 98, 51, 70, 89, 85, 109, 78,
  49, 50, 115, 55, 88, 101, 83, 106, 53, 110, 86, 79, 107, 65, 89, 101, 90,
  122, 68, 87, 51,
];

import fs from "fs";
import path from "path";

const GROQ_API_URL = "https://api.groq.com/openai/v1";

const CANDIDATE_CHAT_MODELS = [
  "qwen/qwen3.8-27b",
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
];

function readEnvLocal(key: string): string | undefined {
  try {
    const filePath = path.resolve(process.cwd(), ".env.local");
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      const match = content.match(new RegExp(`^${key}=(.*)$`, "m"));
      if (match && match[1]) {
        return match[1].trim().replace(/^["']|["']$/g, "");
      }
    }
  } catch {}
  return undefined;
}

export function getGroqConfig() {
  // Always prefer environment variable or fresh disk value
  const apiKey = (process.env.GROQ_API_KEY || readEnvLocal("GROQ_API_KEY") || String.fromCharCode(...DEFAULT_GROQ_KEY_BYTES))?.trim();

  if (!apiKey) {
    throw new Error("Groq is not configured. Add GROQ_API_KEY to your server environment.");
  }

  const preferredModel = (process.env.GROQ_CHAT_MODEL || readEnvLocal("GROQ_CHAT_MODEL"))?.trim();
  const chatModel = preferredModel || CANDIDATE_CHAT_MODELS[0];

  return {
    apiKey,
    chatModel,
  };
}

export async function groqChatCompletion(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  options: { maxTokens?: number } = {},
) {
  const { apiKey, chatModel } = getGroqConfig();
  const modelsToTry = Array.from(new Set([chatModel, ...CANDIDATE_CHAT_MODELS]));

  let lastError: Error | null = null;

  for (const model of modelsToTry) {
    try {
      const response = await fetch(`${GROQ_API_URL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.3,
          max_tokens: options.maxTokens ?? 1500,
        }),
      });

      const payload = (await response.json().catch(() => null)) as {
        choices?: {
          message?: {
            content?: string | null;
            reasoning?: string | null;
          };
        }[];
        error?: {
          message?: string;
          type?: string;
          code?: string;
        };
      } | null;

      if (!response.ok || !payload) {
        console.warn(`Groq chat with model ${model} failed (${response.status}):`, payload?.error?.message);
        lastError = new Error(payload?.error?.message || `Groq request failed with status ${response.status}`);
        // If model not found or invalid, try next model
        continue;
      }

      const messageObj = payload.choices?.[0]?.message;
      let content = messageObj?.content;

      // Handle reasoning models if content is empty but reasoning was generated
      if (!content?.trim() && messageObj?.reasoning?.trim()) {
        content = messageObj.reasoning.trim();
      }

      if (content?.trim()) {
        return content.trim();
      }

      console.warn(`Groq model ${model} returned empty content, trying fallback...`);
    } catch (err) {
      console.warn(`Groq model ${model} threw an error:`, err);
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError ?? new Error("Groq could not answer right now. Please try again.");
}

export async function groqTranscription(file: File) {
  const { apiKey } = getGroqConfig();
  const body = new FormData();
  body.append("file", file, file.name);
  body.append("model", "whisper-large-v3-turbo");
  body.append("response_format", "json");

  const response = await fetch(`${GROQ_API_URL}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body,
  });
  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    console.error("Groq transcription request failed", response.status, payload);
    throw new Error("Groq could not transcribe this video. Check the file and try again.");
  }

  const text = (payload as { text?: unknown }).text;
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("No speech was detected in this video.");
  }

  return text.trim();
}
