import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { aiChatCompletion, buildNotebookLMPrompt } from "@/lib/study/ai-provider";

const MAX_MESSAGE_LENGTH = 4000;
const errorResponse = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

const STOP_WORDS = new Set([
  "the", "and", "that", "this", "with", "from", "for", "are", "what", "how", "why", "who", "when", "where", "can", "you", "tell", "about", "explain", "does", "have", "been", "were", "which",
]);

function retrieveRelevantContext(
  sourceText: string,
  query: string,
  maxChars: number = 180_000,
): { context: string; citations: string[] } {
  const chunkSize = 2500;
  const overlap = 250;
  const chunks: { text: string; score: number; index: number }[] = [];

  const queryTerms = query
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  let start = 0;
  let chunkIdx = 0;
  while (start < sourceText.length) {
    const end = Math.min(start + chunkSize, sourceText.length);
    const textChunk = sourceText.slice(start, end);

    let score = 0;
    const lowerChunk = textChunk.toLowerCase();

    for (const term of queryTerms) {
      const occurrences = (lowerChunk.match(new RegExp(`\\b${term}`, "g")) || []).length;
      score += occurrences * 3;
    }

    if (query.length > 5 && lowerChunk.includes(query.toLowerCase())) {
      score += 25;
    }

    chunks.push({ text: textChunk, score, index: chunkIdx });
    start += chunkSize - overlap;
    chunkIdx++;
  }

  // Always keep overview chunk (table of contents / introduction)
  const selectedIndices = new Set<number>([0]);
  let accumulatedChars = chunks[0]?.text.length ?? 0;

  // Sort by relevance score
  const sorted = [...chunks].sort((a, b) => b.score - a.score);
  for (const chunk of sorted) {
    if (selectedIndices.has(chunk.index)) continue;
    if (accumulatedChars + chunk.text.length > maxChars) break;
    selectedIndices.add(chunk.index);
    accumulatedChars += chunk.text.length;
  }

  const citations = Array.from(selectedIndices)
    .sort((a, b) => a - b)
    .map((idx) => chunks[idx].text)
    .map((chunk) => chunk.trim());
  return {
    context: citations.map((chunk, index) => `[${index + 1}] ${chunk}`).join("\n\n"),
    citations,
  };
}

async function getOptionalUser() {
  if (!isSupabaseConfigured()) return { user: null, supabase: null };

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return { user: user ?? null, supabase };
  } catch {
    return { user: null, supabase: null };
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const rawNotebookId = url.searchParams.get("notebookId");
  const fallbackThreadId = rawNotebookId ? `thread-${rawNotebookId}` : "general-chat-thread";

  if (!rawNotebookId) {
    return NextResponse.json({ threadId: `general-${crypto.randomUUID()}`, messages: [] });
  }

  const { user, supabase } = await getOptionalUser();

  // If unauthenticated or no Supabase, return a ready-to-use local thread
  if (!user || !supabase) {
    return NextResponse.json({ threadId: fallbackThreadId, messages: [] });
  }

  const notebookId = rawNotebookId;

  try {
    let query = supabase.from("study_chat_threads").select("id, notebook_id");
    query = notebookId ? query.eq("notebook_id", notebookId) : query.is("notebook_id", null);
    const { data: existing } = await query.eq("user_id", user.id).maybeSingle();

    let threadId = existing?.id;
    if (!threadId) {
      const { data: created } = await supabase
        .from("study_chat_threads")
        .insert({ user_id: user.id, notebook_id: notebookId })
        .select("id")
        .single();
      threadId = created?.id;
    }

    if (!threadId) {
      return NextResponse.json({ threadId: fallbackThreadId, messages: [] });
    }

    const { data: messages } = await supabase
      .from("study_chat_entries")
      .select("id, role, content, created_at")
      .eq("thread_id", threadId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(100);

    return NextResponse.json({
      threadId,
      messages: messages ?? [],
    });
  } catch (error) {
    console.warn("Could not load study chat from database, using local session:", error);
    return NextResponse.json({ threadId: fallbackThreadId, messages: [] });
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Send a valid chat message.", 400);
  }
  if (!body || typeof body !== "object") return errorResponse("Send a valid chat message.", 400);

  const {
    threadId: rawThreadId,
    notebookId,
    message,
    sourceContent: clientSourceContent,
    notebookTitle,
    previousMessages: clientPreviousMessages,
  } = body as {
    threadId?: unknown;
    notebookId?: unknown;
    message?: unknown;
    sourceContent?: unknown;
    notebookTitle?: unknown;
    previousMessages?: unknown;
  };

  if (typeof message !== "string" || !message.trim()) {
    return errorResponse("Message cannot be empty.", 400);
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return errorResponse(`Message is too long. Max ${MAX_MESSAGE_LENGTH} characters.`, 400);
  }

  const threadId = typeof rawThreadId === "string" && rawThreadId ? rawThreadId : "chat-thread";
  const { user, supabase } = await getOptionalUser();

  // 1. Build Document / Notebook Study Context
  let extractedSource = typeof clientSourceContent === "string" ? clientSourceContent.trim() : "";
  let notebookIsAiTopic = false;

  // If user is authenticated and notebookId provided, attempt to load content from Supabase
  if (!extractedSource && typeof notebookId === "string" && notebookId && user && supabase) {
    try {
      const { data: notebook } = await supabase
        .from("study_notebooks")
        .select("id, title, content, source_type")
        .eq("id", notebookId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (notebook?.source_type === "text" && notebook.content.startsWith("AI topic notebook:")) {
        notebookIsAiTopic = true;
      } else if (notebook?.content) {
        extractedSource = notebook.content;
      }
    } catch (err) {
      console.warn("Could not load notebook from Supabase:", err);
    }
  }

  let systemPrompt: string;
  let citations: string[] = [];
  if (notebookIsAiTopic) {
    const title = typeof notebookTitle === "string" && notebookTitle ? notebookTitle : "this topic";
    systemPrompt = `You are Synapse, a clear and capable study tutor. The user is studying ${title}. There is no uploaded source, so teach this topic from reliable general knowledge. Respond in a concise, formal, polite, and encouraging manner. Use Markdown headings, bold key terms, and bullets when they improve readability. Do not include raw Markdown symbols as decorative text. Explain the core idea first, then add a short example or key distinction when useful. Avoid long introductions, repetition, and unnecessary follow-up offers.`;
  } else if (extractedSource) {
    const docTitle = typeof notebookTitle === "string" && notebookTitle ? notebookTitle : "Uploaded PDF Document";
    const relevantExcerpt = retrieveRelevantContext(extractedSource, message, 180_000);
    citations = relevantExcerpt.citations;
    systemPrompt = `${buildNotebookLMPrompt(relevantExcerpt.context, docTitle)}\n\nUse a concise, formal, polite teaching style. Prefer short paragraphs, Markdown headings, bold key concepts, and bullets where useful. Avoid repetition and unnecessary follow-up offers.`;
  } else {
    systemPrompt = `You are Synapse, a capable study tutor. Respond in a concise, formal, polite, and encouraging manner. Teach clearly from general knowledge. Use Markdown headings, bold key terms, and bullets when they improve readability. Avoid long introductions, repetition, and unnecessary follow-up offers.`;
  }

  // 2. Build Message History
  let history: { role: "user" | "assistant"; content: string }[] = [];

  // Check client-provided history
  if (Array.isArray(clientPreviousMessages)) {
    history = clientPreviousMessages
      .filter((m) => m && typeof m.content === "string" && (m.role === "user" || m.role === "assistant"))
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }));
  } else if (user && supabase && threadId && !threadId.startsWith("thread-") && !threadId.startsWith("general-")) {
    try {
      const { data: dbHistory } = await supabase
        .from("study_chat_entries")
        .select("role, content")
        .eq("thread_id", threadId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (dbHistory) {
        history = dbHistory.reverse().map((item) => ({
          role: item.role as "user" | "assistant",
          content: item.content,
        }));
      }
    } catch {
      // Ignore DB history fetch error
    }
  }

  // 3. Request Answer from AI Engine (NVIDIA NIM -> Gemini -> Groq Cascade)
  let answer: string;
  let modelUsed = "";
  let providerUsed = "";
  try {
    const aiResult = await aiChatCompletion([
      {
        role: "system",
        content: systemPrompt,
      },
      ...history,
      { role: "user", content: message.trim() },
    ], { maxTokens: 2500 });

    answer = aiResult.answer;
    modelUsed = aiResult.model;
    providerUsed = aiResult.provider;
  } catch (error) {
    console.error("AI engine chat completion error:", error);
    const messageText = error instanceof Error ? error.message : "AI engine request failed.";
    return errorResponse(messageText, 502);
  }

  // 4. Save to Supabase if authenticated
  if (user && supabase && typeof notebookId === "string" && notebookId && threadId
      && !threadId.startsWith("thread-") && !threadId.startsWith("general-")) {
    try {
      const { data: ownedThread } = await supabase
        .from("study_chat_threads")
        .select("id")
        .eq("id", threadId)
        .eq("notebook_id", notebookId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!ownedThread) {
        return NextResponse.json({ error: "This chat does not belong to the selected notebook." }, { status: 403 });
      }
      await supabase.from("study_chat_entries").insert([
        { thread_id: threadId, user_id: user.id, role: "user", content: message.trim() },
        { thread_id: threadId, user_id: user.id, role: "assistant", content: answer },
      ]);
      await supabase
        .from("study_chat_threads")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", threadId)
        .eq("user_id", user.id);
    } catch (saveError) {
      console.warn("Could not save to Supabase history:", saveError);
    }
  }

  return NextResponse.json({
    answer,
    threadId,
    model: modelUsed,
    provider: providerUsed,
    citations,
  });
}
