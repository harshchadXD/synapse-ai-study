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

  const envVal = process.env[key]?.trim();
  return envVal && envVal.length > 0 ? envVal : undefined;
}

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "mixtral-8x7b-32768",
  "gemma2-9b-it",
  "gemma-7b-it",
];

function getGroqModel(): string {
  const preferred = readEnvKey("GROQ_CHAT_MODEL");
  return preferred || "llama-3.3-70b-versatile";
}

async function callGroq(
  messages: ChatMessage[],
  options: AIOptions = {}
): Promise<{ text: string; model: string; provider: "groq" }> {
  const apiKey = readEnvKey("GROQ_API_KEY");
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured in .env.local");
  }

  const model = getGroqModel();

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
    throw new Error(payload?.error?.message || `Groq HTTP ${response.status}`);
  }

  const messageObj = payload.choices?.[0]?.message;
  let content = messageObj?.content;
  if (!content?.trim() && messageObj?.reasoning?.trim()) {
    content = messageObj.reasoning.trim();
  }

  if (!content?.trim()) {
    throw new Error("Groq returned empty response");
  }

  return {
    text: content.trim(),
    model,
    provider: "groq",
  };
}

export async function aiChatCompletion(
  messages: ChatMessage[],
  options: AIOptions = {}
): Promise<{ answer: string; model: string; provider: "groq" }> {
  try {
    const res = await callGroq(messages, options);
    return { answer: res.text, model: res.model, provider: "groq" };
  } catch (err) {
    throw new Error(
      `Groq API failed: ${err instanceof Error ? err.message : String(err)}. Verify GROQ_API_KEY in .env.local`
    );
  }
}

export function getAIProviderStatus() {
  const groqKey = Boolean(readEnvKey("GROQ_API_KEY"));
  const preferredModel = readEnvKey("GROQ_CHAT_KEY") || "llama-3.3-70b-versatile";

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