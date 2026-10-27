import { parseOffice } from "officeparser";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { groqTranscription } from "@/lib/study/groq";
import { aiChatCompletion } from "@/lib/study/ai-provider";

export const maxDuration = 60;

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB
const MAX_SOURCE_TEXT = 3_000_000; // 3 million characters (~1500 pages)

const DOCUMENT_TYPES = new Map<string, string>([
  [".pdf", "pdf"],
  [".pptx", "pptx"],
  [".ppt", "ppt"],
  [".pps", "pptx"],
  [".ppsx", "pptx"],
  [".potx", "pptx"],
  [".odp", "odp"],
  [".docx", "docx"],
  [".doc", "doc"],
  [".dotx", "docx"],
  [".odt", "odt"],
  [".rtf", "rtf"],
  [".txt", "txt"],
  [".text", "txt"],
  [".md", "md"],
  [".markdown", "md"],
  [".csv", "csv"],
  [".xlsx", "xlsx"],
  [".epub", "epub"],
]);

const VIDEO_EXTENSIONS = new Set([
  ".mp4", ".mpeg", ".webm", ".mov",
]);

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Extracts readable text from OfficeParser v8 AST structure (PDFs, PPTX, DOCX, ODT, etc.)
 */
function extractFromAst(ast: unknown): string {
  if (typeof ast === "string") return ast.trim();
  if (!ast || typeof ast !== "object") return "";

  const record = ast as Record<string, unknown>;

  // OfficeParser v8 AST content array (PDF pages, PPTX slides, DOCX paragraphs)
  if (Array.isArray(record.content)) {
    const pieces: string[] = [];
    for (const item of record.content) {
      if (item && typeof item === "object") {
        const obj = item as Record<string, unknown>;
        if (typeof obj.text === "string" && obj.text.trim()) {
          pieces.push(obj.text.trim());
        } else if (Array.isArray(obj.children)) {
          const sub = obj.children
            .map((c: unknown) => (c && typeof c === "object" ? String((c as Record<string, unknown>).text ?? "") : ""))
            .filter(Boolean)
            .join(" ");
          if (sub.trim()) pieces.push(sub.trim());
        }
      }
    }
    if (pieces.length > 0) return pieces.join("\n\n");
  }

  if (typeof record.text === "string" && record.text.trim()) {
    return record.text.trim();
  }

  return "";
}

/**
 * Fallback parser for standard text-based PDFs when officeparser fails on non-standard tags.
 * Scans uncompressed and stream text objects.
 */
function extractPdfFallbackText(buffer: Buffer): string {
  try {
    const raw = buffer.toString("binary");
    const textPieces: string[] = [];

    // Extract text inside BT (Begin Text) ... ET (End Text) blocks
    const btRegex = /BT\s([\s\S]*?)ET/g;
    let match: RegExpExecArray | null;

    while ((match = btRegex.exec(raw)) !== null) {
      const block = match[1];
      const tjRegex = /\(([^)]+)\)\s*Tj/g;
      let tjMatch: RegExpExecArray | null;
      while ((tjMatch = tjRegex.exec(block)) !== null) {
        textPieces.push(tjMatch[1]);
      }

      const arrayTjRegex = /\[([^\]]+)\]\s*TJ/g;
      let arrayMatch: RegExpExecArray | null;
      while ((arrayMatch = arrayTjRegex.exec(block)) !== null) {
        const inner = arrayMatch[1];
        const innerStrings = inner.match(/\(([^)]+)\)/g);
        if (innerStrings) {
          textPieces.push(innerStrings.map((s) => s.slice(1, -1)).join(" "));
        }
      }
    }

    if (textPieces.length > 0) {
      return textPieces
        .join(" ")
        .replace(/\\([()\\])/g, "$1") // unescape parens
        .replace(/\s+/g, " ")
        .trim();
    }
  } catch (err) {
    console.warn("Fallback PDF stream parsing error:", err);
  }
  return "";
}

/**
 * Fallback extractor for legacy binary formats (e.g. PPT 97-2003, DOC 97-2003).
 * Extracts readable UTF-16LE and ASCII text runs.
 */
function extractBinaryOfficeText(buffer: Buffer): string {
  const minLength = 3;
  const utf16Chunks: string[] = [];
  let curUtf16 = "";

  for (let i = 0; i < buffer.length - 1; i += 2) {
    const code = buffer.readUInt16LE(i);
    if ((code >= 32 && code <= 126) || code === 10 || code === 13 || code === 9) {
      curUtf16 += String.fromCharCode(code);
    } else {
      if (curUtf16.trim().length >= minLength) utf16Chunks.push(curUtf16.trim());
      curUtf16 = "";
    }
  }
  if (curUtf16.trim().length >= minLength) utf16Chunks.push(curUtf16.trim());

  const asciiChunks: string[] = [];
  let curAscii = "";
  for (let i = 0; i < buffer.length; i++) {
    const byte = buffer[i];
    if ((byte >= 32 && byte <= 126) || byte === 10 || byte === 13 || byte === 9) {
      curAscii += String.fromCharCode(byte);
    } else {
      if (curAscii.trim().length >= minLength) asciiChunks.push(curAscii.trim());
      curAscii = "";
    }
  }
  if (curAscii.trim().length >= minLength) asciiChunks.push(curAscii.trim());

  const chosen = (utf16Chunks.join(" ").length > asciiChunks.join(" ").length ? utf16Chunks : asciiChunks)
    .filter(
      (s) =>
        !/^(Root Entry|Current User|PowerPoint Document|SummaryInformation|DocumentSummaryInformation|WordDocument|CompObj)/i.test(
          s,
        ) && !/^[^\w\s]+$/.test(s),
    );

  return chosen.join("\n\n");
}

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (err) {
    console.error("formData parsing error on ingest:", err);
    return jsonError(
      "Could not read uploaded file stream. If your file is very large, try a file under 50 MB.",
      400,
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) return jsonError("Choose a file to upload.", 400);
  if (file.size === 0) return jsonError("The selected file is empty.", 400);
  if (file.size > MAX_FILE_SIZE) {
    return jsonError(
      `Files must be 50 MB or smaller. This file is ${(file.size / (1024 * 1024)).toFixed(1)} MB.`,
      413,
    );
  }

  const extension = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
  const sourceName = file.name.slice(0, 200);
  let text = "";
  let sourceType = "text";

  // Check optional Supabase session (does NOT block parsing if unauthenticated)
  let userId: string | null = null;
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) userId = user.id;
    } catch {
      // Supabase is optional; continue parsing for guest / local study
    }
  }

  // Transcribe video files with Groq Whisper.
  if (VIDEO_EXTENSIONS.has(extension) || file.type.startsWith("video/")) {
    try {
      text = (await groqTranscription(file)).slice(0, MAX_SOURCE_TEXT);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Transcription failed.";
      const status = message.includes("not configured") ? 503 : 502;
      return jsonError(message, status);
    }
    sourceType = "video";
  } else {
    // 2. Documents: PDF, PPTX, PPT, DOCX, DOC, TXT, MD, etc.
    let matchedType = DOCUMENT_TYPES.get(extension);

    // Fallback MIME sniffing if extension is missing or non-standard
    if (!matchedType && file.type) {
      if (file.type.includes("pdf")) matchedType = "pdf";
      else if (file.type.includes("presentation") || file.type.includes("powerpoint")) matchedType = "pptx";
      else if (file.type.includes("word") || file.type.includes("officedocument.wordprocessing")) matchedType = "docx";
      else if (file.type.startsWith("text/")) matchedType = "txt";
    }

    if (!matchedType) {
      return jsonError(
        "Supported formats: PDF (.pdf), PowerPoint (.pptx, .ppt), Word (.docx, .doc), Notes (.txt, .md), and video (.mp4, .mpeg, .webm, .mov).",
        415,
      );
    }

    if (matchedType === "txt" || matchedType === "md") {
      text = (await file.text()).trim().slice(0, MAX_SOURCE_TEXT);
    } else {
      const arrayBuf = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);

      // Handle legacy binary PPT or DOC
      if (matchedType === "ppt" || matchedType === "doc") {
        try {
          const ast = await parseOffice(buffer, {
            fileType: (matchedType === "ppt" ? "pptx" : "docx") as "pptx" | "docx",
          });
          text = extractFromAst(ast).slice(0, MAX_SOURCE_TEXT);
        } catch {
          // Ignore and use binary extractor
        }

        if (!text) {
          text = extractBinaryOfficeText(buffer).slice(0, MAX_SOURCE_TEXT);
        }
      } else {
        // Modern documents (PDF, PPTX, DOCX, etc.)
        try {
          const ast = await parseOffice(buffer, {
            fileType: matchedType as "pdf" | "pptx" | "docx" | "xlsx" | "odt" | "odp" | "rtf" | "csv" | "epub",
          });
          text = extractFromAst(ast).slice(0, MAX_SOURCE_TEXT);

          if (!text) {
            const toRes = await (ast as { to?: (format: string) => Promise<{ value?: string }> }).to?.("text").catch(() => null);
            text = (toRes?.value || String(toRes || "")).trim().slice(0, MAX_SOURCE_TEXT);
          }
        } catch (err) {
          console.warn(`OfficeParser primary parser failed for ${file.name}, trying fallbacks:`, err);
        }

        if (!text && matchedType === "pdf") {
          text = extractPdfFallbackText(buffer).slice(0, MAX_SOURCE_TEXT);
        }

        if (!text) {
          text = extractBinaryOfficeText(buffer).slice(0, MAX_SOURCE_TEXT);
        }
      }
    }

    sourceType = matchedType === "txt" || matchedType === "md" ? "text" : matchedType;
  }

  // Clean and normalize extracted text
  text = text
    .replace(/[\r\n]{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();

  if (!text) {
    return jsonError(
      "No readable text was found in this file. If this is a scanned image PDF, please use a searchable text PDF or export it with OCR.",
      422,
    );
  }

  // Calculate stats
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  // Optional: Generate a quick 2-bullet summary with AI engine so the user gets instant insights
  let summary = "";
  try {
    const aiResult = await aiChatCompletion([
      {
        role: "system",
        content: "You are Synapse, a study assistant. Provide a concise 2-sentence summary of the main topic and key takeaway of this study material.",
      },
      {
        role: "user",
        content: `Document: ${sourceName}\n\nContent excerpt:\n${text.slice(0, 4000)}`,
      },
    ], { maxTokens: 150 });
    summary = aiResult.answer;
  } catch (e) {
    // Summary is an enhancement; don't fail ingestion if AI engine is busy
    console.warn("Could not generate auto-summary on ingest:", e);
  }

  return NextResponse.json({
    content: text,
    sourceName,
    sourceType,
    wordCount,
    summary,
    userId,
    truncated: text.length >= MAX_SOURCE_TEXT,
  });
}
