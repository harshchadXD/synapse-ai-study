import fs from "fs";
import path from "path";

// ═══════════════════════════════════════════════════════════════════════════════
// MULTI-PROVIDER AI ENGINE: NVIDIA NIM (Primary) + GOOGLE GEMINI + GROQ
// ═══════════════════════════════════════════════════════════════════════════════

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIOptions {
  maxTokens?: number;
  temperature?: number;
  preferProvider?: "nvidia" | "gemini" | "groq";
}

// Read .env.local dynamically so hot changes are immediately picked up
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

// ─────────────────────────────────────────────────────────────────────────────
// 1. NVIDIA NIM CONFIGURATION & MULTI-MODEL ROTATION
// ─────────────────────────────────────────────────────────────────────────────
const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

const NVIDIA_MODELS = [
  "meta/llama-3.3-70b-instruct",
  "mistralai/mistral-large-2-instruct",
  "nvidia/llama-3.1-nemotron-70b-instruct",
  "deepseek-ai/deepseek-r1",
];

// Track exhaustion and rotation state
interface ModelTracker {
  requests: number;
  exhaustedUntil: number; // timestamp ms
  lastError?: string;
}

const nvidiaModelStatus: Record<string, ModelTracker> = {};
let currentNvidiaModelIndex = 0;

function getNvidiaModel(): string {
  const now = Date.now();
  // Find first model not currently marked exhausted
  for (let i = 0; i < NVIDIA_MODELS.length; i++) {
    const idx = (currentNvidiaModelIndex + i) % NVIDIA_MODELS.length;
    const model = NVIDIA_MODELS[idx];
    const status = nvidiaModelStatus[model];
    if (!status || status.exhaustedUntil < now) {
      currentNvidiaModelIndex = idx;
      return model;
    }
  }
  // If all are marked exhausted, reset and return first
  return NVIDIA_MODELS[0];
}

function markNvidiaModelExhausted(model: string, reason: string) {
  console.warn(`[NVIDIA NIM] Model ${model} exhausted/rate-limited: ${reason}. Switching to next model...`);
  nvidiaModelStatus[model] = {
    requests: (nvidiaModelStatus[model]?.requests ?? 0) + 1,
    exhaustedUntil: Date.now() + 60_000, // backoff for 60 seconds
    lastError: reason,
  };
  currentNvidiaModelIndex = (currentNvidiaModelIndex + 1) % NVIDIA_MODELS.length;
}

async function callNvidiaNIM(
  messages: ChatMessage[],
  options: AIOptions = {},
): Promise<{ text: string; model: string; provider: "nvidia" }> {
  const apiKey = readEnvKey("NVIDIA_API_KEY");
  if (!apiKey) {
    throw new Error("NVIDIA_API_KEY is not configured.");
  }

  const modelToTry = getNvidiaModel();

  const response = await fetch(NVIDIA_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelToTry,
      messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? 2048,
    }),
  });

  const data = (await response.json().catch(() => null)) as {
    choices?: { message?: { content?: string } }[];
    error?: { message?: string; code?: number };
  } | null;

  if (!response.ok || !data?.choices?.[0]?.message?.content) {
    const errMsg = data?.error?.message || `HTTP ${response.status}`;
    // If rate-limited or exhausted, mark model and throw to trigger rotation or provider fallback
    if (response.status === 429 || response.status === 402 || errMsg.toLowerCase().includes("quota") || errMsg.toLowerCase().includes("rate limit")) {
      markNvidiaModelExhausted(modelToTry, errMsg);
    }
    throw new Error(`NVIDIA NIM (${modelToTry}) failed: ${errMsg}`);
  }

  // Increment usage and proactively rotate every 3 requests for load-balancing
  if (!nvidiaModelStatus[modelToTry]) {
    nvidiaModelStatus[modelToTry] = { requests: 1, exhaustedUntil: 0 };
  } else {
    nvidiaModelStatus[modelToTry].requests++;
    if (nvidiaModelStatus[modelToTry].requests % 3 === 0) {
      currentNvidiaModelIndex = (currentNvidiaModelIndex + 1) % NVIDIA_MODELS.length;
    }
  }

  return {
    text: data.choices[0].message.content.trim(),
    model: modelToTry,
    provider: "nvidia",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. GOOGLE GEMINI API CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────
const GEMINI_MODELS = [
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
];

async function callGoogleGemini(
  messages: ChatMessage[],
  options: AIOptions = {},
): Promise<{ text: string; model: string; provider: "gemini" }> {
  const apiKey = readEnvKey("GEMINI_API_KEY") || readEnvKey("GOOGLE_API_KEY");
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  // Format messages for Gemini API
  const systemMessage = messages.find((m) => m.role === "system")?.content;
  const conversationMessages = messages.filter((m) => m.role !== "system");

  const contents = conversationMessages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  let lastErr: Error | null = null;

  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload: Record<string, unknown> = {
        contents,
        generationConfig: {
          temperature: options.temperature ?? 0.3,
          maxOutputTokens: options.maxTokens ?? 2048,
        },
      };

      if (systemMessage) {
        payload.systemInstruction = {
          parts: [{ text: systemMessage }],
        };
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => null)) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
        error?: { message?: string };
      } | null;

      if (!response.ok || !data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error(data?.error?.message || `Gemini ${model} failed with HTTP ${response.status}`);
      }

      return {
        text: data.candidates[0].content.parts[0].text.trim(),
        model,
        provider: "gemini",
      };
    } catch (err) {
      console.warn(`Gemini model ${model} failed:`, err);
      lastErr = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastErr || new Error("Google Gemini API could not generate a response.");
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. GROQ CLOUD API CONFIGURATION (ULTRA-FAST FALLBACK)
// ─────────────────────────────────────────────────────────────────────────────
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODELS = [
  "qwen/qwen3.8-27b",
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
];

async function callGroqCloud(
  messages: ChatMessage[],
  options: AIOptions = {},
): Promise<{ text: string; model: string; provider: "groq" }> {
  const apiKey = readEnvKey("GROQ_API_KEY");
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  let lastErr: Error | null = null;
  for (const model of GROQ_MODELS) {
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
        throw new Error(payload?.error?.message || `Groq HTTP ${response.status}`);
      }

      const messageObj = payload.choices?.[0]?.message;
      let content = messageObj?.content;
      if (!content?.trim() && messageObj?.reasoning?.trim()) {
        content = messageObj.reasoning.trim();
      }

      if (content?.trim()) {
        return {
          text: content.trim(),
          model,
          provider: "groq",
        };
      }
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastErr || new Error("Groq API could not generate a response.");
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. UNIFIED INTELLIGENT CASCADE ROUTER
// ─────────────────────────────────────────────────────────────────────────────
export async function aiChatCompletion(
  messages: ChatMessage[],
  options: AIOptions = {},
): Promise<{ answer: string; model: string; provider: "nvidia" | "gemini" | "groq" }> {
  const errors: string[] = [];

  // Order 1: NVIDIA NIM (Primary if configured)
  const nvidiaKey = readEnvKey("NVIDIA_API_KEY");
  if (nvidiaKey) {
    // Try current or next NVIDIA model
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await callNvidiaNIM(messages, options);
        return { answer: res.text, model: res.model, provider: "nvidia" };
      } catch (err) {
        errors.push(err instanceof Error ? err.message : String(err));
      }
    }
  }

  // Order 2: Google Gemini API (Secondary)
  const geminiKey = readEnvKey("GEMINI_API_KEY") || readEnvKey("GOOGLE_API_KEY");
  if (geminiKey) {
    try {
      const res = await callGoogleGemini(messages, options);
      return { answer: res.text, model: res.model, provider: "gemini" };
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  // Order 3: Groq Cloud API (Tertiary / Fallback)
  const groqKey = readEnvKey("GROQ_API_KEY");
  if (groqKey) {
    try {
      const res = await callGroqCloud(messages, options);
      return { answer: res.text, model: res.model, provider: "groq" };
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  throw new Error(
    `No AI providers were able to fulfill the request. Please verify NVIDIA_API_KEY, GEMINI_API_KEY, or GROQ_API_KEY in .env.local.\nErrors: ${errors.join("; ")}`,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. REAL-TIME AI ENGINE STATUS & HEALTH MONITOR
// ─────────────────────────────────────────────────────────────────────────────
export function getAIProviderStatus() {
  const nvidiaKey = Boolean(readEnvKey("NVIDIA_API_KEY"));
  const geminiKey = Boolean(readEnvKey("GEMINI_API_KEY") || readEnvKey("GOOGLE_API_KEY"));
  const groqKey = Boolean(readEnvKey("GROQ_API_KEY"));

  const now = Date.now();
  const nvidiaStatus = NVIDIA_MODELS.map((m) => {
    const s = nvidiaModelStatus[m];
    const isCooling = s ? s.exhaustedUntil > now : false;
    return {
      model: m,
      status: isCooling ? "cooling_down" : "ready",
      cooldownRemainingSeconds: isCooling ? Math.ceil((s.exhaustedUntil - now) / 1000) : 0,
      requestsServed: s?.requests ?? 0,
      lastError: s?.lastError,
    };
  });

  let activeProvider: "nvidia" | "gemini" | "groq" | "none" = "none";
  let activeModel = "none";

  if (nvidiaKey) {
    activeProvider = "nvidia";
    activeModel = getNvidiaModel();
  } else if (geminiKey) {
    activeProvider = "gemini";
    activeModel = GEMINI_MODELS[0];
  } else if (groqKey) {
    activeProvider = "groq";
    activeModel = GROQ_MODELS[0];
  }

  return {
    configured: {
      nvidia: nvidiaKey,
      gemini: geminiKey,
      groq: groqKey,
    },
    activeProvider,
    activeModel,
    nvidiaModels: nvidiaStatus,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. NOTEBOOKLM SYSTEM PROMPT BUILDER
// ─────────────────────────────────────────────────────────────────────────────
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
