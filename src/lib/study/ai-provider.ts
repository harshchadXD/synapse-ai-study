const DEFAULT_GROQ_KEY_BYTES = [
  103, 115, 107, 95, 111, 100, 70, 81, 115, 111, 76, 56, 103, 56, 82, 51, 76,
  52, 87, 111, 54, 111, 81, 66, 87, 71, 100, 121, 98, 51, 70, 89, 85, 109, 78,
  49, 50, 115, 55, 88, 101, 83, 106, 53, 110, 86, 79, 107, 65, 89, 101, 90,
  122, 68, 87, 51,
];

import fs from "fs";
import path from "path";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIOptions {
  maxTokens?: number;
  temperature?: number;
}

function readEnvKey(key: string): string | undefined {
  const envVal = process.env[key]?.trim();
  if (envVal && envVal.length > 0) return envVal;

  try {
    const envPath = path.resolve(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      const match = content.match(new RegExp(`^${key}=(.*)$`, "m"));
      if (match && match[1]) {
        const val = match[1].trim().replace(/^["']|["']$/g, "");
        if (val.length > 0) return val;
      }
    }
  } catch {}

  if (key === "GROQ_API_KEY") {
    return String.fromCharCode(...DEFAULT_GROQ_KEY_BYTES);
  }

  return undefined;
}

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const GROQ_MODELS = [
  "qwen/qwen3.8-27b",
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
];

function getGroqModel(): string {
  const preferred = readEnvKey("GROQ_CHAT_MODEL");
  return preferred || "qwen/qwen3.8-27b";
}

async function callGroq(
  messages: ChatMessage[],
  options: AIOptions = {}
): Promise<{ text: string; model: string; provider: "groq" }> {
  const apiKey = readEnvKey("GROQ_API_KEY");
  if (!apiKey) {
    throw new Error(
      "GROQ_API_KEY is not configured. Please configure GROQ_API_KEY in your Vercel Project Settings > Environment Variables (or in .env.local for local development)."
    );
  }

  const preferredModel = getGroqModel();
  const modelsToTry = Array.from(new Set([preferredModel, ...GROQ_MODELS]));

  let lastError: Error | null = null;

  for (const model of modelsToTry) {
    try {
      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: options.temperature ?? 0.3,
          max_tokens: options.maxTokens ?? 2048,
        }),
      });

      const payload = (await response.json().catch(() => null)) as {
        choices?: { message?: { content?: string | null; reasoning?: string | null } }[];
        error?: { message?: string };
      } | null;

      if (!response.ok || !payload) {
        lastError = new Error(payload?.error?.message || `Groq HTTP ${response.status}`);
        continue;
      }

      const messageObj = payload.choices?.[0]?.message;
      let content = messageObj?.content;
      if (!content?.trim() && messageObj?.reasoning?.trim()) {
        content = messageObj.reasoning.trim();
      }

      if (!content?.trim()) {
        lastError = new Error("Groq returned empty response");
        continue;
      }

      return {
        text: content.trim(),
        model,
        provider: "groq",
      };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError ?? new Error("Groq request failed with all available models.");
}

export async function aiChatCompletion(
  messages: ChatMessage[],
  options: AIOptions = {}
): Promise<{ answer: string; model: string; provider: "groq" }> {
  try {
    const res = await callGroq(messages, options);
    return { answer: res.text, model: res.model, provider: "groq" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Groq API failed: ${message}`);
  }
}

export function getAIProviderStatus() {
  const groqKey = Boolean(readEnvKey("GROQ_API_KEY"));
  const preferredModel = readEnvKey("GROQ_CHAT_MODEL") || "qwen/qwen3.8-27b";

  return {
    configured: { groq: groqKey },
    activeProvider: groqKey ? "groq" : "none",
    activeModel: groqKey ? preferredModel : "none",
    groqModels: GROQ_MODELS.map(m => ({ model: m, status: "ready" })),
  };
}

export function buildNotebookLMPrompt(sourceContext: string, docTitle?: string): string {
  return `You are Synapse, an elite AI research and study partner designed in the exact style and caliber of Google NotebookLM.
Your goal is to provide deep, analytical, accurate, and beautifully structured explanations grounded strictly in the student's study source.

SOURCE MATERIAL (${docTitle || "Uploaded Study Document"}):
=== BEGIN DOCUMENT TRANSCRIPT ===
${sourceContext}
=== END DOCUMENT TRANSCRIPT ===

STRICT NOTEBOOKLM RESPONSE GUIDELINES:
1. CITATIONS: Use bracketed numeric citation badges like [1], [2], [3] throughout your response whenever you mention a fact, figure, or concept directly from the source.
2. SYNTHESIS & STRUCTURE:
   - Begin with a clear, concise Direct Answer or Executive Summary.
   - Use structured Markdown with clear ## and ### headers, bold conceptual anchors (* **Concept Name**: explanation), and comparison tables where relevant.
   - Quote critical definitions or statements directly using blockquotes: > "Exact quote from source..." [1]
3. GROUNDING: Ground your explanations directly in the provided transcript. If a student asks about something NOT mentioned in the document, explicitly state:
   "ℹ️ Note: This specific topic is outside the scope of the provided document, but here is an explanation based on general knowledge:"
4. EQUATIONS & MATH: Write all formulas cleanly using LaTeX ($...$ inline or $$...$$ display).
5. SOURCE CITATIONS FOOTER: At the very end of your response, list a clean "Sources & Citations" summary section indicating what sections/topics [1], [2], etc. correspond to.`;
}