import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const maxDuration = 10;

const YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3";
const MAX_CAPTION_BYTES = 5 * 1024 * 1024;
const MAX_TRANSCRIPT_LENGTH = 3_000_000;

type GoogleApiError = {
  error?: {
    message?: string;
    errors?: Array<{ reason?: string }>;
  };
};

function getVideoId(videoUrl: string) {
  try {
    const url = new URL(videoUrl);
    const host = url.hostname.toLowerCase().replace(/^(www\.|m\.)/, "");
    let id: string | null = null;
    if (host === "youtu.be") {
      id = url.pathname.split("/").filter(Boolean)[0] ?? null;
    } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
      if (url.pathname === "/watch") {
        id = url.searchParams.get("v");
      } else {
        const [kind, value] = url.pathname.split("/").filter(Boolean);
        if (["embed", "shorts", "live"].includes(kind ?? "")) id = value ?? null;
      }
    }
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

function cleanTranscript(raw: string) {
  const lines = raw.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").split("\n");
  const cues: string[] = [];
  let cueLines: string[] = [];

  const flushCue = () => {
    const text = cueLines
      .filter((line) => {
        const trimmed = line.trim();
        return (
          trimmed.length > 0 &&
          !/^WEBVTT(?:\s|$)/i.test(trimmed) &&
          !/^(?:NOTE|STYLE|REGION)(?:\s|$)/i.test(trimmed) &&
          !/^\d+$/.test(trimmed) &&
          !/^(?:\d{2}:)?\d{2}:\d{2}[.,]\d{3}\s+-->/.test(trimmed)
        );
      })
      .join(" ")
      .replace(/<[^>]*>/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;|&apos;/g, "'")
      .replace(/&#(\d+);/g, (_, value: string) => String.fromCodePoint(Number(value)))
      .replace(/&#x([0-9a-f]+);/gi, (_, value: string) => String.fromCodePoint(parseInt(value, 16)))
      .replace(/\s+/g, " ")
      .trim();

    if (text && text !== cues[cues.length - 1]) cues.push(text);
    cueLines = [];
  };

  for (const line of lines) {
    if (!line.trim()) {
      flushCue();
      continue;
    }
    cueLines.push(line.trim());
  }
  flushCue();
  return cues.join(" ").slice(0, MAX_TRANSCRIPT_LENGTH);
}

async function getGoogleError(response: Response) {
  try {
    const payload = (await response.json()) as GoogleApiError;
    return {
      reason: payload.error?.errors?.[0]?.reason ?? "",
      message: payload.error?.message ?? "",
    };
  } catch {
    return { reason: "", message: "" };
  }
}

function apiError(message: string, status: number, code: string) {
  return NextResponse.json({ error: message, code }, { status });
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return apiError("YouTube imports require Supabase authentication to be configured.", 503, "AUTH_NOT_CONFIGURED");
  }
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return apiError("Sign in before importing YouTube captions.", 401, "AUTH_REQUIRED");
    }
  } catch {
    return apiError("Could not verify your session. Please sign in again.", 401, "AUTH_REQUIRED");
  }

  const accessToken = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!accessToken) {
    return apiError("Connect your Google account to import YouTube captions.", 401, "GOOGLE_AUTH_REQUIRED");
  }

  let videoUrl: unknown;
  try {
    ({ video_url: videoUrl } = (await request.json()) as { video_url?: unknown });
  } catch {
    return apiError("Send a valid YouTube video URL.", 400, "INVALID_REQUEST");
  }
  if (typeof videoUrl !== "string" || videoUrl.length > 2048) {
    return apiError("Send a valid YouTube video URL.", 400, "INVALID_VIDEO_URL");
  }
  const videoId = getVideoId(videoUrl);
  if (!videoId) {
    return apiError("Enter a valid YouTube video link.", 400, "INVALID_VIDEO_URL");
  }

  const headers = { Authorization: `Bearer ${accessToken}` };
  let listResponse: Response;
  try {
    const listUrl = new URL(`${YOUTUBE_API_URL}/captions`);
    listUrl.searchParams.set("part", "snippet");
    listUrl.searchParams.set("videoId", videoId);
    listResponse = await fetch(listUrl, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(3500),
    });
  } catch {
    return apiError("YouTube timed out while listing captions. Please try again.", 504, "YOUTUBE_TIMEOUT");
  }

  if (!listResponse.ok) {
    const googleError = await getGoogleError(listResponse);
    if (listResponse.status === 401) {
      return apiError("Your Google access token expired. Refresh the connection and retry.", 401, "GOOGLE_TOKEN_EXPIRED");
    }
    if (listResponse.status === 403 && /quotaExceeded|dailyLimitExceeded/i.test(googleError.reason)) {
      return apiError("The YouTube API daily quota is exhausted. Please try again after the quota resets.", 403, "YOUTUBE_QUOTA_EXCEEDED");
    }
    if (listResponse.status === 403 && /insufficientPermissions|insufficient.*scope/i.test(`${googleError.reason} ${googleError.message}`)) {
      return apiError("Reconnect Google and grant YouTube access to continue.", 403, "GOOGLE_SCOPE_REQUIRED");
    }
    return apiError(
      listResponse.status === 403
        ? "Google denied access to this video. The signed-in account must be able to edit it."
        : "YouTube could not list captions for this video.",
      listResponse.status === 403 ? 403 : listResponse.status >= 500 ? 502 : 400,
      listResponse.status === 403 ? "VIDEO_PERMISSION_REQUIRED" : "YOUTUBE_API_ERROR",
    );
  }

  const listPayload = (await listResponse.json()) as {
    items?: Array<{
      id?: string;
      snippet?: { language?: string; trackKind?: string };
    }>;
  };
  const tracks = listPayload.items ?? [];
  if (!tracks.length) {
    return apiError("This video has no caption tracks available to your Google account.", 404, "CAPTIONS_NOT_FOUND");
  }

  const englishTracks = tracks.filter((track) => track.snippet?.language?.toLowerCase().startsWith("en"));
  const selectedTrack =
    englishTracks.find((track) => track.snippet?.trackKind !== "ASR") ??
    englishTracks.find((track) => track.snippet?.trackKind === "ASR") ??
    tracks[0];
  if (!selectedTrack?.id) {
    return apiError("YouTube returned an invalid caption track.", 502, "INVALID_CAPTION_TRACK");
  }

  let downloadResponse: Response;
  try {
    const downloadUrl = new URL(`${YOUTUBE_API_URL}/captions/${encodeURIComponent(selectedTrack.id)}`);
    downloadUrl.searchParams.set("tfmt", "vtt");
    downloadResponse = await fetch(downloadUrl, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(5500),
    });
  } catch {
    return apiError("YouTube timed out while downloading captions. Please try again.", 504, "YOUTUBE_TIMEOUT");
  }

  if (!downloadResponse.ok) {
    const googleError = await getGoogleError(downloadResponse);
    if (downloadResponse.status === 401) {
      return apiError("Your Google access token expired. Refresh the connection and retry.", 401, "GOOGLE_TOKEN_EXPIRED");
    }
    if (downloadResponse.status === 403 && /quotaExceeded|dailyLimitExceeded/i.test(googleError.reason)) {
      return apiError("The YouTube API daily quota is exhausted. Please try again after the quota resets.", 403, "YOUTUBE_QUOTA_EXCEEDED");
    }
    if (downloadResponse.status === 403 && /insufficientPermissions|insufficient.*scope/i.test(`${googleError.reason} ${googleError.message}`)) {
      return apiError("Reconnect Google and grant YouTube access to continue.", 403, "GOOGLE_SCOPE_REQUIRED");
    }
    return apiError(
      downloadResponse.status === 403
        ? "YouTube captions can only be downloaded for videos your account is allowed to edit."
        : "YouTube could not download this caption track.",
      downloadResponse.status === 403 ? 403 : downloadResponse.status >= 500 ? 502 : 400,
      downloadResponse.status === 403 ? "VIDEO_PERMISSION_REQUIRED" : "YOUTUBE_API_ERROR",
    );
  }

  const contentLength = Number(downloadResponse.headers.get("content-length") ?? 0);
  if (contentLength > MAX_CAPTION_BYTES) {
    return apiError("This caption track is too large to import.", 413, "CAPTIONS_TOO_LARGE");
  }
  const rawCaptions = await downloadResponse.text();
  if (new TextEncoder().encode(rawCaptions).byteLength > MAX_CAPTION_BYTES) {
    return apiError("This caption track is too large to import.", 413, "CAPTIONS_TOO_LARGE");
  }
  const transcript = cleanTranscript(rawCaptions);
  if (!transcript) {
    return apiError("YouTube returned an empty caption track.", 422, "EMPTY_CAPTIONS");
  }

  return NextResponse.json({
    video_id: videoId,
    transcript,
    source_name: `YouTube ${videoId}.youtube`,
    word_count: transcript.split(/\s+/).filter(Boolean).length,
  });
}
