"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/theme-provider";
import { CustomSelect } from "@/components/custom-select";

type IconName =
  | "home"
  | "book"
  | "chat"
  | "cards"
  | "quiz"
  | "folder"
  | "search"
  | "plus"
  | "arrow"
  | "check"
  | "clock"
  | "listCheck"
  | "pause"
  | "play"
  | "file"
  | "upload"
  | "pin"
  | "youtube"
  | "spark"
  | "chevron"
  | "dots"
  | "close"
  | "logout"
  | "menu"
  | "x"
  | "user"
  | "mail"
  | "globe";

function Icon({ name, size = 19 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-7h6v7" /></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5v-12Z" /><path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H20M8 7h7" /></>,
    chat: <><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3 2v-5.5A7.5 7.5 0 1 1 20 11.5Z" /><path d="M8 11h.01M12 11h.01M16 11h.01" /></>,
    cards: <><rect x="5" y="5" width="14" height="15" rx="2" /><path d="M8 3h11a2 2 0 0 1 2 2v12M9 10h6M9 14h4" /></>,
    quiz: <><rect x="4" y="3" width="16" height="18" rx="3" /><path d="m8 12 2.5 2.5L16 9M8 7h8" /></>,
    folder: <><path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" /><path d="M3 10h18" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    listCheck: <><path d="m3 5 2 2 4-4M3 12l2 2 4-4M3 19l2 2 4-4M13 6h8M13 13h8M13 20h8" /></>,
    pause: <><path d="M8 5v14M16 5v14" /></>,
    play: <path d="m8 5 12 7-12 7V5Z" />,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8M8 17h6" /></>,
    upload: <><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 16v4h16v-4" /></>,
    pin: <><path d="m16 3 5 5-4 1-3 4-1 4-2-2-2-2-2-2 4-1 4-3z" /><path d="m7 17-4 4" /></>,
    youtube: <><rect x="3" y="5" width="18" height="14" rx="4" /><path d="m10 9 5 3-5 3V9Z" fill="currentColor" stroke="none" /></>,
    spark: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" /><path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    dots: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
    x: <><path d="m18 6-12 12M6 6l12 12" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    globe: <><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 12a3 3 0 0 1 0 6" /></>,
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

type Notebook = {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  sourceType?: string;
  notes: number;
  opened: string;
  createdAt?: string;
  symbol: string;
  accent: "teal" | "coral";
};

type StudyMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type StudyTask = {
  id: string;
  title: string;
  status: "To Do" | "In Progress" | "Completed";
  priority: "High" | "Medium" | "Low";
  dueDate: string;
  createdAt: string;
};

type FocusSession = {
  phase: "focus" | "break";
  endsAt: number | null;
  remainingMs: number;
  cycles: number;
};

const FOCUS_DURATION_MS = 25 * 60 * 1000;
const BREAK_DURATION_MS = 5 * 60 * 1000;
const FOCUS_SESSION_STORAGE_KEY = "synapse_focus_session";

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function inferStudyTopic(message: string): string | null {
  const trimmed = message.trim().replace(/[?!.,]+$/g, "");
  const learningPrefix = /^(?:(?:please\s+)?(?:can you\s+)?(?:explain|teach me(?: about)?|help me understand|help me learn|tell me about|what is|what are|how does|how do|how can|why does|why do|why is|why are|describe|define)\s+)/i;
  if (!learningPrefix.test(trimmed)) return null;
  let topic = trimmed.replace(learningPrefix, "");
  topic = topic
    .replace(/^(?:the concept of|the idea of|about)\s+/i, "")
    .replace(/\s+(?:work|works|working|function|functions|happen|happens|occur|occurs|mean|means|look like|are formed|is formed)$/i, "")
    .replace(/\s+(?:in simple terms|simply|in detail|step by step)$/i, "")
    .replace(/[?!.,]+$/g, "")
    .trim();
  if (topic.length < 3 || topic.length > 100) return null;
  if (/^(?:me|it|this|that|you|yourself)$/i.test(topic)) return null;
  return topic.replace(/\b\w/g, (character) => character.toUpperCase());
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]!);
}

function sanitizeNotesHtml(html: string) {
  const document = new DOMParser().parseFromString(html, "text/html");
  const allowedTags = new Set(["P", "DIV", "BR", "STRONG", "B", "EM", "I", "U", "SPAN", "UL", "OL", "LI", "H1", "H2", "H3", "BLOCKQUOTE"]);
  const allowedColors = new Set(["color", "background-color", "font-size"]);
  const sanitizeNode = (node: Node): Node[] => {
    if (node.nodeType === Node.TEXT_NODE) return [document.createTextNode(node.textContent ?? "")];
    if (!(node instanceof HTMLElement)) return [];
    const children = Array.from(node.childNodes).flatMap(sanitizeNode);
    if (!allowedTags.has(node.tagName)) return children;
    const clean = document.createElement(node.tagName.toLowerCase());
    for (const property of allowedColors) {
      const value = node.style.getPropertyValue(property);
      if (value && (/^(#[\da-f]{3,8}|rgba?\([\d\s.,%]+\)|hsla?\([\d\s.,%]+\))$/i.test(value) || (property === "font-size" && /^\d+(?:px|pt|em|rem|%)$/.test(value)))) {
        clean.style.setProperty(property, value);
      }
    }
    children.forEach((child) => clean.appendChild(child));
    return [clean];
  };
  const container = document.createElement("div");
  Array.from(document.body.childNodes).flatMap(sanitizeNode).forEach((node) => container.appendChild(node));
  return container.innerHTML.slice(0, 45000);
}

function markdownToNotesHtml(markdown: string) {
  const inline = (line: string) => escapeHtml(line)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.+?)__/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/_(.+?)_/g, "<em>$1</em>");

  const blocks: string[] = [];
  let listItems: string[] = [];
  const flushList = () => {
    if (listItems.length) blocks.push(`<ul>${listItems.map((item) => `<li>${inline(item)}</li>`).join("")}</ul>`);
    listItems = [];
  };

  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      continue;
    }
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    const bullet = /^[-*•]\s+(.+)$/.exec(line);
    if (bullet) {
      listItems.push(bullet[1]);
    } else {
      flushList();
      blocks.push(heading
        ? `<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`
        : `<p>${inline(line)}</p>`);
    }
  }
  flushList();
  return sanitizeNotesHtml(blocks.join(""));
}

function renderChatMarkdown(
  content: string,
  messageId: string,
  isAssistant: boolean,
  hasCitations: boolean,
  onCitation: (messageId: string, number: number) => void,
): ReactNode {
  const inline = (text: string, keyPrefix: string): ReactNode[] => text
    .split(/(\*\*.+?\*\*|__.+?__|\*[^*\n]+?\*|_[^_\n]+?_|`[^`\n]+`|\[\d+\])/g)
    .filter(Boolean)
    .map((part, index) => {
      const key = `${keyPrefix}-${index}`;
      const citation = /^\[(\d+)\]$/.exec(part);
      if (citation && isAssistant && hasCitations) {
        return <button className="citation-chip" type="button" key={key} onClick={() => onCitation(messageId, Number(citation[1]))}>[{citation[1]}]</button>;
      }
      if (/^\*\*.+\*\*$|^__.+__$/.test(part)) return <strong key={key}>{part.slice(2, -2)}</strong>;
      if (/^\*[^*]+\*$|^_[^_]+_$/.test(part)) return <em key={key}>{part.slice(1, -1)}</em>;
      if (/^`[^`]+`$/.test(part)) return <code key={key}>{part.slice(1, -1)}</code>;
      return <span key={key}>{part}</span>;
    });

  const lines = content.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let listItems: { text: string; index: number }[] = [];
  const flushList = () => {
    if (listItems.length) {
      blocks.push(<ul key={`${messageId}-list-${listItems[0].index}`}>{listItems.map((item) => <li key={`${messageId}-li-${item.index}`}>{inline(item.text, `${messageId}-item-${item.index}`)}</li>)}</ul>);
      listItems = [];
    }
  };

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      return;
    }
    const bullet = /^(?:[-*•]|\d+[.)])\s+(.+)$/.exec(line);
    if (bullet) {
      listItems.push({ text: bullet[1], index });
      return;
    }
    flushList();
    const heading = /^#{1,6}\s+(.+)$/.exec(line);
    blocks.push(heading
      ? <h3 key={`${messageId}-h-${index}`}>{inline(heading[1], `${messageId}-heading-${index}`)}</h3>
      : <p key={`${messageId}-p-${index}`}>{inline(line, `${messageId}-line-${index}`)}</p>);
  });
  flushList();
  return blocks;
}

type Flashcard = { front: string; back: string };
type FlashcardDeck = {
  id: string;
  notebook_id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  cards: Flashcard[];
  created_at: string;
};
type QuizQuestion = {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
};
type QuizAttempt = {
  id: string;
  notebook_id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  questions: QuizQuestion[];
  answers: number[];
  score: number | null;
  feedback: string | null;
  completed_at: string | null;
};

const navigation: { label: string; icon: IconName }[] = [
  { label: "Home", icon: "home" },
  { label: "Notebooks", icon: "book" },
  { label: "Chat", icon: "chat" },
  { label: "Tasks", icon: "listCheck" },
  { label: "Focus", icon: "clock" },
];

type MascotEmotion = "smiling" | "focused" | "excited" | "talking";

function StudyIllustration() {
  const [emotion, setEmotion] = useState<MascotEmotion>("talking");
  const [isBlinking, setIsBlinking] = useState(false);
  const [activeKey, setActiveKey] = useState<number>(1);
  const [bubbleVisible, setBubbleVisible] = useState(true);
  const [talkFrame, setTalkFrame] = useState(0);

  // 1. Looping speech bubble: stays ~4.5s -> retracts into computer -> waits 5s -> emerges from computer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (bubbleVisible) {
      setEmotion("talking");
      timer = setTimeout(() => {
        setBubbleVisible(false);
      }, 4500);
    } else {
      // While bubble is hidden for 5 seconds:
      // First 2.5s: focused on typing with rapid clicks
      // Next 2.5s: excited / thinking with sparkle eyes
      setEmotion("focused");
      const focusTimer = setTimeout(() => {
        setEmotion("excited");
      }, 2500);

      timer = setTimeout(() => {
        setBubbleVisible(true);
      }, 5000);

      return () => {
        clearTimeout(focusTimer);
        clearTimeout(timer);
      };
    }
    return () => clearTimeout(timer);
  }, [bubbleVisible]);

  // 2. Natural blinking cycle
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 170);
    }, 3300);
    return () => clearInterval(blinkInterval);
  }, []);

  // 3. Active keyboard typing cadence
  useEffect(() => {
    const keyInterval = setInterval(() => {
      setActiveKey((prev) => {
        let next = Math.floor(Math.random() * 8) + 1;
        while (next === prev) next = Math.floor(Math.random() * 8) + 1;
        return next;
      });
    }, emotion === "focused" ? 120 : 170);
    return () => clearInterval(keyInterval);
  }, [emotion]);

  // 4. Animated talking mouth while speech bubble is visible
  useEffect(() => {
    if (emotion !== "talking") return;
    const talkInterval = setInterval(() => {
      setTalkFrame((f) => (f + 1) % 4);
    }, 170);
    return () => clearInterval(talkInterval);
  }, [emotion]);

  // Typing hand vertical offsets based on active key
  const leftHandY = activeKey % 2 === 1 ? 2 : 0;
  const rightHandY = activeKey % 2 === 0 ? 2 : 0;

  return (
    <div className="study-mascot-container" style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* ─── SPEECH BUBBLE EMERGING DIRECTLY FROM THE COMPUTER ─── */}
      <div className={`welcome-speech ${bubbleVisible ? "is-visible" : "is-hidden"}`}>
        <span className="speech-spark">✨</span>
        <span className="speech-text">Let&apos;s learn!</span>
        <span className="speech-cursor" />
        <div className="speech-tail">
          <span className="tail-1" />
          <span className="tail-2" />
          <span className="tail-3" />
        </div>
      </div>

      {/* ─── ANTIGRAVITY IDE RETRO-CYBER TERMINAL MASCOT ─── */}
      <svg
        className="study-illustration pixel-mascot"
        viewBox="0 0 160 145"
        shapeRendering="crispEdges"
        aria-label="Antigravity AI Study Companion"
      >
        <defs>
          <radialGradient id="screenPhosphor" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor="#132c22" />
            <stop offset="70%" stopColor="#0b1712" />
            <stop offset="100%" stopColor="#070f0c" />
          </radialGradient>
          <radialGradient id="levitationGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(195, 239, 131, 0.35)" />
            <stop offset="60%" stopColor="rgba(134, 197, 237, 0.15)" />
            <stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
          </radialGradient>
        </defs>

        {/* ── ZERO-G LEVITATION SHADOW & GLOW ── */}
        <ellipse cx="80" cy="138" rx="56" ry="5" fill="var(--mascot-shadow)" />
        <ellipse cx="80" cy="130" rx="46" ry="8" fill="url(#levitationGlow)" />

        {/* ── FLOATING ANTI-GRAVITY LEVITATION BASE ── */}
        <rect x="24" y="118" width="112" height="6" fill="#141a24" rx="2" />
        {/* Glowing neon levitation emitter track */}
        <rect x="26" y="118" width="108" height="2" fill="#c3ef83" opacity="0.8" />
        <rect x="36" y="120" width="88" height="1" fill="#86c5ed" opacity="0.6" />
        <rect x="24" y="123" width="112" height="2" fill="#0d1118" />

        {/* ── MECHANICAL KEYBOARD ON FLOATING DESK ── */}
        <rect x="48" y="106" width="64" height="12" fill="#18202c" rx="2" />
        <rect x="49" y="106" width="62" height="1" fill="#2d3748" />

        {/* Row 1 Keys */}
        <rect
          x="52"
          y={activeKey === 1 ? 109.5 : 108}
          width="6"
          height="3"
          fill={activeKey === 1 ? "#c3ef83" : "#f1ede2"}
          rx="0.5"
        />
        <rect
          x="60"
          y={activeKey === 2 ? 109.5 : 108}
          width="6"
          height="3"
          fill={activeKey === 2 ? "#c3ef83" : "#f1ede2"}
          rx="0.5"
        />
        <rect
          x="68"
          y={activeKey === 3 ? 109.5 : 108}
          width="6"
          height="3"
          fill={activeKey === 3 ? "#c3ef83" : "#f1ede2"}
          rx="0.5"
        />
        <rect
          x="76"
          y={activeKey === 4 ? 109.5 : 108}
          width="6"
          height="3"
          fill={activeKey === 4 ? "#c3ef83" : "#f1ede2"}
          rx="0.5"
        />
        <rect
          x="84"
          y={activeKey === 5 ? 109.5 : 108}
          width="6"
          height="3"
          fill={activeKey === 5 ? "#c3ef83" : "#f1ede2"}
          rx="0.5"
        />
        <rect
          x="92"
          y={activeKey === 6 ? 109.5 : 108}
          width="6"
          height="3"
          fill={activeKey === 6 ? "#c3ef83" : "#f1ede2"}
          rx="0.5"
        />
        <rect
          x="100"
          y={activeKey === 7 ? 109.5 : 108}
          width="8"
          height="3"
          fill={activeKey === 7 ? "#86c5ed" : "#86c5ed"}
          rx="0.5"
        />

        {/* Row 2 Keys & Spacebar */}
        <rect x="52" y="112" width="8" height="3" fill="#f1ede2" rx="0.5" />
        <rect
          x="62"
          y={activeKey === 8 ? 113.5 : 112}
          width="34"
          height="3"
          fill={activeKey === 8 ? "#c3ef83" : "#e6e1d5"}
          rx="0.5"
        />
        <rect x="98" y="112" width="10" height="3" fill="#c3ef83" rx="0.5" />

        {/* Floating Keystroke Click Sparks */}
        {activeKey === 3 && (
          <g transform="translate(68, 102)">
            <rect x="1" y="0" width="2" height="2" fill="#c3ef83" />
            <rect x="0" y="1" width="4" height="1" fill="#ffffff" />
          </g>
        )}
        {activeKey === 6 && (
          <g transform="translate(93, 102)">
            <rect x="1" y="0" width="2" height="2" fill="#86c5ed" />
            <rect x="0" y="1" width="4" height="1" fill="#ffffff" />
          </g>
        )}

        {/* Typing Paws / Hands actively tapping keys */}
        <g transform={`translate(0, ${leftHandY})`}>
          <rect x="56" y="105" width="8" height="5" fill="#131720" rx="1.5" />
          <rect x="57" y="105" width="6" height="4" fill="#c3ef83" rx="1" />
          <rect x="58" y="106" width="2" height="2" fill="#ffffff" />
        </g>
        <g transform={`translate(0, ${rightHandY})`}>
          <rect x="94" y="105" width="8" height="5" fill="#131720" rx="1.5" />
          <rect x="95" y="105" width="6" height="4" fill="#c3ef83" rx="1" />
          <rect x="96" y="106" width="2" height="2" fill="#ffffff" />
        </g>

        {/* ── MONITOR LEVITATION STAND ── */}
        <rect x="68" y="96" width="24" height="6" fill="#141a24" rx="1" />
        <rect x="74" y="88" width="12" height="10" fill="#c94714" />
        <rect x="74" y="88" width="12" height="2" fill="#ffa366" />

        {/* ─── VIBRANT BRIGHT ORANGE RETRO TERMINAL CHASSIS ─── */}
        {/* Deep Contrast Shadow */}
        <rect x="41" y="27" width="78" height="64" rx="3" fill="#10141c" />
        {/* Main Vibrant Bright Orange Body */}
        <rect x="42" y="26" width="76" height="62" rx="3" fill="#ff6b2b" />
        {/* Top/Left Bevel Highlights (Warm Bright Peach Highlight) */}
        <rect x="44" y="27" width="72" height="2.5" fill="#ffa366" />
        <rect x="43" y="28" width="2.5" height="58" fill="#ffa366" />
        {/* Bottom/Right Shadow Bevels (Deep Burnt Orange Shadow) */}
        <rect x="44" y="85.5" width="72" height="2.5" fill="#c94714" />
        <rect x="115.5" y="28" width="2.5" height="58" fill="#c94714" />

        {/* ── GOOGLE ANTIGRAVITY IDE LOGO EMBLEM ON TOP BEZEL ── */}
        <g className="antigravity-logo-emblem">
          {/* Obsidian badge backing for high-contrast pop on orange */}
          <rect x="69" y="29" width="22" height="7.5" rx="2" fill="#121822" />
          <rect x="69" y="29" width="22" height="7.5" rx="2" fill="none" stroke="#c3ef83" strokeWidth="0.8" opacity="0.8" />
          {/* Antigravity Inverted Triangle Delta Emblem */}
          <polygon points="80,31 75,35 85,35" fill="none" stroke="#c3ef83" strokeWidth="1.3" />
          {/* Inner Zero-G Levitating Core */}
          <circle cx="80" cy="33.5" r="1.3" fill="#86c5ed" />
        </g>

        {/* ── METALLIC ANTENNA & TWINKLING SPARK ── */}
        <rect x="76" y="23" width="8" height="4" fill="#c94714" />
        <rect x="78" y="15" width="4" height="9" fill="#4a5568" />
        <rect x="79" y="12" width="2" height="4" fill="#cbd5e1" />
        {/* Twinkling Claude Code / Antigravity 4-point Star Spark */}
        <g className="pixel-mascot-spark">
          <rect x="78" y="5" width="4" height="8" fill="#c3ef83" />
          <rect x="74" y="7" width="12" height="4" fill="#c3ef83" />
          <rect x="79" y="3" width="2" height="12" fill="#c3ef83" />
          <rect x="79" y="6" width="2" height="6" fill="#ffffff" />
        </g>

        {/* ── CRT SCREEN BEZEL ── */}
        <rect x="47" y="38" width="66" height="46" rx="2" fill="#121720" />

        {/* ── CRT INNER PHOSPHOR SCREEN ── */}
        <rect x="50" y="41" width="60" height="40" rx="1" fill="url(#screenPhosphor)" />

        {/* CRT Scanline Grid */}
        <g opacity="0.18">
          <line x1="50" y1="44" x2="110" y2="44" stroke="#000" strokeWidth="1" />
          <line x1="50" y1="48" x2="110" y2="48" stroke="#000" strokeWidth="1" />
          <line x1="50" y1="52" x2="110" y2="52" stroke="#000" strokeWidth="1" />
          <line x1="50" y1="56" x2="110" y2="56" stroke="#000" strokeWidth="1" />
          <line x1="50" y1="60" x2="110" y2="60" stroke="#000" strokeWidth="1" />
          <line x1="50" y1="64" x2="110" y2="64" stroke="#000" strokeWidth="1" />
          <line x1="50" y1="68" x2="110" y2="68" stroke="#000" strokeWidth="1" />
          <line x1="50" y1="72" x2="110" y2="72" stroke="#000" strokeWidth="1" />
          <line x1="50" y1="76" x2="110" y2="76" stroke="#000" strokeWidth="1" />
        </g>
        {/* Screen Glass Reflection */}
        <polygon points="52,43 72,43 54,78 52,78" fill="#ffffff" opacity="0.06" />

        {/* ─── CHANGING EMOTION FACES ─── */}
        {/* Rosy Pixel Blush Cheeks */}
        <g fill="#fb7185" opacity="0.85">
          <rect x="54" y="63" width="5" height="3" />
          <rect x="101" y="63" width="5" height="3" />
        </g>

        {/* 1. EYES BASED ON EMOTION & BLINKING */}
        {isBlinking ? (
          /* Blinking: Happy closed eye lines */
          <g fill="#c3ef83">
            <rect x="61" y="54" width="9" height="2" />
            <rect x="60" y="55" width="2" height="2" />
            <rect x="90" y="54" width="9" height="2" />
            <rect x="89" y="55" width="2" height="2" />
          </g>
        ) : emotion === "excited" ? (
          /* Excited: 4-point star sparkle eyes */
          <g fill="#c3ef83">
            <g transform="translate(62, 50)">
              <rect x="3" y="0" width="3" height="9" fill="#c3ef83" />
              <rect x="0" y="3" width="9" height="3" fill="#c3ef83" />
              <rect x="3" y="3" width="3" height="3" fill="#ffffff" />
            </g>
            <g transform="translate(90, 50)">
              <rect x="3" y="0" width="3" height="9" fill="#c3ef83" />
              <rect x="0" y="3" width="9" height="3" fill="#c3ef83" />
              <rect x="3" y="3" width="3" height="3" fill="#ffffff" />
            </g>
          </g>
        ) : emotion === "focused" ? (
          /* Focused: Concentrated eyes glancing at keyboard */
          <g>
            <rect x="62" y="52" width="8" height="7" fill="#c3ef83" />
            <rect x="65" y="54" width="4" height="4" fill="#0b1712" />
            <rect x="63" y="52" width="2" height="2" fill="#ffffff" />
            <rect x="90" y="52" width="8" height="7" fill="#c3ef83" />
            <rect x="93" y="54" width="4" height="4" fill="#0b1712" />
            <rect x="91" y="52" width="2" height="2" fill="#ffffff" />
          </g>
        ) : emotion === "talking" ? (
          /* Talking: Cheerful welcoming gaze with a wink or happy eyes */
          <g>
            {/* Left Eye: Open & bright */}
            <rect x="62" y="51" width="8" height="8" fill="#c3ef83" />
            <rect x="63" y="52" width="3" height="3" fill="#ffffff" />
            {/* Right Eye: Friendly playful wink */}
            <g fill="#c3ef83">
              <rect x="90" y="54" width="8" height="2" />
              <rect x="89" y="53" width="2" height="2" />
              <rect x="97" y="53" width="2" height="2" />
            </g>
          </g>
        ) : (
          /* Smiling (Default): Expressive square pixel eyes */
          <g>
            <rect x="62" y="51" width="8" height="8" fill="#c3ef83" />
            <rect x="63" y="52" width="3" height="3" fill="#ffffff" />
            <rect x="90" y="51" width="8" height="8" fill="#c3ef83" />
            <rect x="91" y="52" width="3" height="3" fill="#ffffff" />
          </g>
        )}

        {/* 2. MOUTH BASED ON EMOTION */}
        {emotion === "talking" ? (
          /* Animated Talking Mouth */
          <g fill="#c3ef83">
            {talkFrame === 0 && (
              <rect x="77" y="67" width="6" height="4" rx="1" fill="#c3ef83" />
            )}
            {talkFrame === 1 && (
              <g>
                <rect x="76" y="66" width="8" height="6" rx="1.5" fill="#c3ef83" />
                <rect x="78" y="68" width="4" height="3" fill="#fb7185" />
              </g>
            )}
            {talkFrame === 2 && (
              <rect x="76" y="68" width="8" height="2" fill="#c3ef83" />
            )}
            {talkFrame === 3 && (
              <g>
                <rect x="75" y="67" width="2" height="2" />
                <rect x="77" y="68" width="6" height="2" />
                <rect x="83" y="67" width="2" height="2" />
              </g>
            )}
          </g>
        ) : emotion === "excited" ? (
          /* Excited Big Open Laugh Smile */
          <g>
            <rect x="75" y="66" width="10" height="6" rx="2" fill="#c3ef83" />
            <rect x="77" y="68" width="6" height="3" fill="#fb7185" />
          </g>
        ) : emotion === "focused" ? (
          /* Focused Concentrated Mouth */
          <g fill="#c3ef83">
            <rect x="77" y="68" width="7" height="2" />
          </g>
        ) : (
          /* Cheerful Upward Smile */
          <g fill="#c3ef83">
            <rect x="75" y="66" width="2" height="2" />
            <rect x="77" y="68" width="6" height="2" />
            <rect x="83" y="66" width="2" height="2" />
          </g>
        )}

        {/* Ambient Antigravity Levitation Sparks */}
        <g className="pixel-mascot-spark" style={{ animationDelay: "1.1s" }}>
          <rect x="33" y="45" width="2" height="2" fill="#86c5ed" />
          <rect x="34" y="43" width="1" height="6" fill="#86c5ed" />
          <rect x="31" y="45" width="7" height="1" fill="#86c5ed" />
        </g>
        <g className="pixel-mascot-spark" style={{ animationDelay: "0.5s" }}>
          <rect x="127" y="37" width="2" height="2" fill="#c3ef83" />
          <rect x="128" y="35" width="1" height="6" fill="#c3ef83" />
          <rect x="125" y="37" width="7" height="1" fill="#c3ef83" />
        </g>
      </svg>
    </div>
  );
}

function NotebookCard({ notebook, onOpen }: { notebook: Notebook; onOpen: () => void }) {
  return (
    <button className="notebook-card" type="button" onClick={onOpen}>
      <span className={`notebook-accent ${notebook.accent}`} />
      <span className={`notebook-symbol ${notebook.accent}`}>{notebook.symbol}</span>
      <span className="notebook-card-menu" aria-hidden="true"><Icon name="dots" size={18} /></span>
      <span className="notebook-name">{notebook.title}</span>
      <span className="notebook-subtitle">{notebook.subtitle}</span>
      <span className="notebook-meta">
        <span><Icon name="file" size={14} /> {notebook.notes} notes</span>
        <span><Icon name="clock" size={14} /> {notebook.opened}</span>
      </span>
    </button>
  );
}

function ProfileAvatar({ name, avatarUrl, size = 32 }: { name: string; avatarUrl?: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className="profile-avatar-img"
        width={size}
        height={size}
        style={{ borderRadius: "50%", objectFit: "cover" }}
      />
    );
  }

  return (
    <span className="profile-avatar-fallback" style={{ width: size, height: size, fontSize: size * 0.35 }}>
      {initials}
    </span>
  );
}

export default function DashboardHome({
  name,
  email,
  provider,
  avatarUrl,
}: {
  name: string;
  email: string;
  provider: string;
  avatarUrl?: string;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const notesEditorRef = useRef<HTMLDivElement>(null);
  const notesSelectionRef = useRef<Range | null>(null);
  const dashboardRef = useRef<HTMLElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [chatMessages, setChatMessages] = useState<StudyMessage[]>([]);
  const [chatPrompt, setChatPrompt] = useState("");
  const [chatContextId, setChatContextId] = useState<string | null>(null);
  const [chatThreadId, setChatThreadId] = useState("");
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [toolNotebookId, setToolNotebookId] = useState("");
  const [toolDifficulty, setToolDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [toolCount, setToolCount] = useState(10);
  const [notesTitle, setNotesTitle] = useState("");
  const [notesContent, setNotesContent] = useState("");
  const [notesCharacterCount, setNotesCharacterCount] = useState(0);
  const [notesFontSize, setNotesFontSize] = useState("16px");
  const [notesTextColor, setNotesTextColor] = useState("#263b37");
  const [notesHighlightColor, setNotesHighlightColor] = useState("#fff09a");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [flashcardDecks, setFlashcardDecks] = useState<FlashcardDeck[]>([]);
  const [currentDeck, setCurrentDeck] = useState<FlashcardDeck | null>(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [showCardBack, setShowCardBack] = useState(false);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [currentQuiz, setCurrentQuiz] = useState<QuizAttempt | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [taskFilter, setTaskFilter] = useState<"All" | "Today" | "Upcoming" | "Completed">("All");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskPriority, setTaskPriority] = useState<StudyTask["priority"]>("Medium");
  const [taskStatus, setTaskStatus] = useState<StudyTask["status"]>("To Do");
  const [notebookFolders, setNotebookFolders] = useState<string[]>([]);
  const [notebookFolderMap, setNotebookFolderMap] = useState<Record<string, string>>({});
  const [activeFolder, setActiveFolder] = useState("");
  const [copiedMessageId, setCopiedMessageId] = useState("");
  const [citationSourcesByMessageId, setCitationSourcesByMessageId] = useState<Record<string, string[]>>({});
  const [citationSelection, setCitationSelection] = useState<{ messageId: string; number: number; text: string } | null>(null);
  const [activeNotebookWorkspaceId, setActiveNotebookWorkspaceId] = useState<string | null>(null);
  const [isLoadingNotebooks, setIsLoadingNotebooks] = useState(true);
  const [isIngesting, setIsIngesting] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [search, setSearch] = useState("");
  const [prompt, setPrompt] = useState("");
  const [youtubeOpen, setYoutubeOpen] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [homeAttachOpen, setHomeAttachOpen] = useState(false);
  const [chatAttachOpen, setChatAttachOpen] = useState(false);
  const [chatYoutubeOpen, setChatYoutubeOpen] = useState(false);
  const [chatYoutubeUrl, setChatYoutubeUrl] = useState("");
  const [notice, setNotice] = useState("");
  const [activeNav, setActiveNav] = useState("Home");
  const [profileOpen, setProfileOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [focusSession, setFocusSession] = useState<FocusSession | null>(null);
  const [focusSessionReady, setFocusSessionReady] = useState(false);
  const [clockNow, setClockNow] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (window.innerWidth <= 820) setSidebarCollapsed(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setClockNow(Date.now());
      try {
        const saved = localStorage.getItem(FOCUS_SESSION_STORAGE_KEY);
        if (saved) {
          const parsed: unknown = JSON.parse(saved);
          if (
            parsed &&
            typeof parsed === "object" &&
            "phase" in parsed &&
            (parsed.phase === "focus" || parsed.phase === "break") &&
            "remainingMs" in parsed &&
            typeof parsed.remainingMs === "number" &&
            Number.isFinite(parsed.remainingMs) &&
            parsed.remainingMs >= 0 &&
            "cycles" in parsed &&
            typeof parsed.cycles === "number" &&
            Number.isInteger(parsed.cycles) &&
            parsed.cycles >= 0 &&
            "endsAt" in parsed &&
            (typeof parsed.endsAt === "number" || parsed.endsAt === null) &&
            (typeof parsed.endsAt !== "number" || Number.isFinite(parsed.endsAt))
          ) {
            const restored = parsed as FocusSession;
            setFocusSession(
              restored.endsAt === null
                ? restored
                : { ...restored, remainingMs: Math.max(0, restored.endsAt - Date.now()) },
            );
          }
        }
      } catch (error) {
        console.warn("Could not restore the focus session:", error);
      } finally {
        setFocusSessionReady(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!focusSessionReady) return;
    try {
      if (focusSession) {
        localStorage.setItem(FOCUS_SESSION_STORAGE_KEY, JSON.stringify(focusSession));
      } else {
        localStorage.removeItem(FOCUS_SESSION_STORAGE_KEY);
      }
    } catch (error) {
      console.warn("Could not save the focus session:", error);
    }
  }, [focusSession, focusSessionReady]);

  useEffect(() => {
    if (!focusSession || focusSession.endsAt === null) return;
    const timer = window.setInterval(() => {
      const now = Date.now();
      setClockNow(now);
      setFocusSession((current) => {
        if (!current || current.endsAt === null || current.endsAt > now) return current;
        const nextPhase = current.phase === "focus" ? "break" : "focus";
        const nextDuration = nextPhase === "focus" ? FOCUS_DURATION_MS : BREAK_DURATION_MS;
        return {
          phase: nextPhase,
          endsAt: now + nextDuration,
          remainingMs: nextDuration,
          cycles: current.cycles + (current.phase === "focus" ? 1 : 0),
        };
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [focusSession]);

  const focusRemainingMs = focusSession
    ? focusSession.endsAt === null
      ? focusSession.remainingMs
      : Math.max(0, focusSession.endsAt - clockNow)
    : 0;

  function formatFocusTime(milliseconds: number) {
    const totalSeconds = Math.ceil(milliseconds / 1000);
    return `${String(Math.floor(totalSeconds / 60)).padStart(2, "0")}:${String(totalSeconds % 60).padStart(2, "0")}`;
  }

  function startFocusSession() {
    setClockNow(Date.now());
    setFocusSession({
      phase: "focus",
      endsAt: Date.now() + FOCUS_DURATION_MS,
      remainingMs: FOCUS_DURATION_MS,
      cycles: 0,
    });
  }

  function toggleFocusSession() {
    if (!focusSession) return;
    if (focusSession.endsAt === null) {
      setClockNow(Date.now());
      setFocusSession({
        ...focusSession,
        endsAt: Date.now() + focusSession.remainingMs,
      });
      return;
    }
    const remainingMs = Math.max(0, focusSession.endsAt - Date.now());
    setFocusSession({ ...focusSession, endsAt: null, remainingMs });
  }

  function endFocusSession() {
    setFocusSession(null);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const savedTasks = localStorage.getItem("synapse_tasks");
        if (savedTasks) setTasks(JSON.parse(savedTasks) as StudyTask[]);
        const savedFolders = localStorage.getItem("synapse_notebook_folders");
        if (savedFolders) {
          const parsed = JSON.parse(savedFolders) as { folders?: string[]; assignments?: Record<string, string> };
          setNotebookFolders(parsed.folders ?? []);
          setNotebookFolderMap(parsed.assignments ?? {});
        }
      } catch (error) {
        console.warn("Could not restore local study preferences:", error);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoadingNotebooks) {
      try {
        localStorage.setItem("synapse_tasks", JSON.stringify(tasks));
      } catch (error) {
        console.warn("Could not save tasks to local storage:", error);
      }
    }
  }, [tasks, isLoadingNotebooks]);

  useEffect(() => {
    if (!isLoadingNotebooks) {
      try {
        localStorage.setItem("synapse_notebook_folders", JSON.stringify({
          folders: notebookFolders,
          assignments: notebookFolderMap,
        }));
      } catch (error) {
        console.warn("Could not save notebook folders to local storage:", error);
      }
    }
  }, [notebookFolders, notebookFolderMap, isLoadingNotebooks]);

  useEffect(() => {
    let isMounted = true;
    async function loadNotebooks() {
      let loadedNotebooks: Notebook[] = [];
      try {
        const { data, error } = await createClient()
          .from("study_notebooks")
          .select("id, title, source_name, source_type, content, created_at")
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          loadedNotebooks = data.map((row, index) => ({
            id: row.id,
            title: row.title,
            subtitle: row.source_name === "AI topic" ? "AI topic · no uploaded source" : `${row.source_name} · ${row.source_type.toUpperCase()}`,
            content: row.content,
            sourceType: row.source_name === "AI topic" ? "topic" : row.source_type,
            notes: 1,
            opened: new Date(row.created_at).toLocaleDateString(),
            createdAt: row.created_at,
            symbol: "✳",
            accent: index % 2 === 0 ? ("teal" as const) : ("coral" as const),
          }));
        }
      } catch (err) {
        console.warn("Supabase load error:", err);
      }

      // Check localStorage for any local notebooks
      try {
        const localSaved = localStorage.getItem("synapse_local_notebooks");
        if (localSaved) {
          const parsed = JSON.parse(localSaved) as Notebook[];
          const existingIds = new Set(loadedNotebooks.map((n) => n.id));
          const localOnly = parsed.filter((n) => !existingIds.has(n.id));
          loadedNotebooks = [...loadedNotebooks, ...localOnly];
        }
      } catch (e) {
        console.warn("Local storage parse error:", e);
      }

      if (!isMounted) return;
      setNotebooks(loadedNotebooks);
      if (loadedNotebooks[0]) setToolNotebookId(loadedNotebooks[0].id);

      try {
        const [decksResult, quizzesResult] = await Promise.all([
          createClient().from("study_flashcard_decks").select("*").order("created_at", { ascending: false }),
          createClient().from("study_quiz_attempts").select("*").order("created_at", { ascending: false }).limit(20),
        ]);
        if (!isMounted) return;
        if (!decksResult.error && decksResult.data) {
          setFlashcardDecks(decksResult.data as FlashcardDeck[]);
        }
        if (!quizzesResult.error && quizzesResult.data) {
          setQuizAttempts(quizzesResult.data as QuizAttempt[]);
        }
      } catch (err) {
        console.warn("Could not load decks/quizzes from Supabase:", err);
      }

      setIsLoadingNotebooks(false);
    }

    void loadNotebooks();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (activeNav !== "Chat") return;
    let isMounted = true;
    const url = chatContextId
      ? `/api/study/chat?notebookId=${encodeURIComponent(chatContextId)}`
      : "/api/study/chat";
    setIsLoadingChat(true);
    fetch(url, { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json() as {
          error?: string;
          threadId?: string;
          messages?: { id: string; role: "user" | "assistant"; content: string }[];
        };
        if (!response.ok) throw new Error(result.error || "Could not load your chat.");
        return result;
      })
      .then((result) => {
        if (!isMounted) return;
        setChatThreadId(result.threadId ?? (chatContextId ? `thread-${chatContextId}` : "general-chat"));
        setChatMessages((result.messages ?? []).map(({ id, role, content }) => ({ id, role, content })));
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setChatThreadId(chatContextId ? `thread-${chatContextId}` : "general-chat");
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingChat(false);
      });
    return () => { isMounted = false; };
  }, [activeNav, chatContextId]);

  useEffect(() => {
    if (!currentDeck) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setCurrentDeck(null);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        setCardIndex((index) => Math.max(0, index - 1));
        setShowCardBack(false);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        setCardIndex((index) => Math.min(currentDeck.cards.length - 1, index + 1));
        setShowCardBack(false);
      } else if (event.key === " " || event.key === "Enter") {
        if ((event.target as HTMLElement).closest("button")) return;
        event.preventDefault();
        setShowCardBack((visible) => !visible);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [currentDeck]);

  useEffect(() => {
    if (activeNav !== "Notes" || !toolNotebookId) return;
    let isMounted = true;
    void createClient()
      .from("study_notes")
      .select("title, content")
      .eq("notebook_id", toolNotebookId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (error) {
          setNotice("Could not load notes. Run the latest Supabase migration.");
          return;
        }
        setNotesTitle(data?.title ?? "");
        const content = data?.content ?? "";
        const editorHtml = /<\/?[a-z][^>]*>/i.test(content)
          ? sanitizeNotesHtml(content)
          : markdownToNotesHtml(content);
        setNotesContent(editorHtml);
        setNotesCharacterCount(new DOMParser().parseFromString(editorHtml, "text/html").body.textContent?.length ?? 0);
        if (notesEditorRef.current) notesEditorRef.current.innerHTML = editorHtml;
      });
    return () => { isMounted = false; };
  }, [activeNav, toolNotebookId]);

  useEffect(() => {
    const dashboard = dashboardRef.current;
    if (!dashboard) return;

    const revealElements = dashboard.querySelectorAll<HTMLElement>(".dashboard-reveal");
    const showAll = () => revealElements.forEach((element) => element.classList.add("is-revealed"));

    if (
      activeNav !== "Home" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window) ||
      (typeof window !== "undefined" && window.innerWidth <= 820)
    ) {
      showAll();
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -8% 0px" });

    revealElements.forEach((element) => {
      if (element.getBoundingClientRect().top < window.innerHeight) {
        element.classList.add("is-revealed");
      } else {
        observer.observe(element);
      }
    });
    dashboard.classList.add("reveal-enabled");
    return () => {
      observer.disconnect();
      dashboard.classList.remove("reveal-enabled");
    };
  }, [activeNav, notebooks.length]);

  const orderedNotebooks = useMemo(
    () => [...notebooks].sort((a, b) => Date.parse(b.createdAt ?? b.opened) - Date.parse(a.createdAt ?? a.opened)),
    [notebooks],
  );
  const visibleNotebooks = useMemo(
    () => orderedNotebooks.filter((notebook) =>
      `${notebook.title} ${notebook.subtitle}`.toLowerCase().includes(search.toLowerCase()),
    ),
    [orderedNotebooks, search],
  );
  const recentNotebook = orderedNotebooks[0] ?? null;
  const pendingTaskCount = tasks.filter((task) => task.status !== "Completed").length;
  const todayKey = localDateKey();
  const urgentTasks = tasks.filter((task) =>
    task.status !== "Completed" && task.dueDate && task.dueDate <= todayKey,
  ).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const filteredTasks = tasks.filter((task) => {
    if (taskFilter === "Completed") return task.status === "Completed";
    if (taskFilter === "Today") return task.dueDate === todayKey && task.status !== "Completed";
    if (taskFilter === "Upcoming") return task.dueDate > todayKey && task.status !== "Completed";
    return true;
  });
  const homeNotebooks = orderedNotebooks.slice(0, 5);
  const folderNotebooks = activeFolder
    ? visibleNotebooks.filter((notebook) => notebookFolderMap[notebook.id] === activeFolder)
    : visibleNotebooks;

  async function createNotebookFromSource(source: {
    content: string;
    sourceName: string;
    sourceType: string;
    truncated?: boolean;
    wordCount?: number;
  }) {
    const title = source.sourceName.replace(/\.[^.]+$/, "").trim().slice(0, 160) || "Untitled study source";
    let notebookId = crypto.randomUUID();
    let createdAt = new Date().toISOString();

    try {
      const { data, error } = await createClient()
        .from("study_notebooks")
        .insert({
          title,
          source_name: source.sourceName,
          source_type: source.sourceType,
          content: source.content,
        })
        .select("id, title, source_name, source_type, content, created_at")
        .single();
      if (!error && data) {
        notebookId = data.id;
        createdAt = data.created_at;
      }
    } catch (err) {
      console.warn("Saved notebook to local memory/storage instead of Supabase:", err);
    }

    const notebook: Notebook = {
      id: notebookId,
      title,
      subtitle: `${source.sourceName} · ${source.sourceType.toUpperCase()}`,
      content: source.content,
      sourceType: source.sourceType,
      notes: 1,
      opened: new Date(createdAt).toLocaleDateString(),
      createdAt,
      symbol: "✳",
      accent: notebooks.length % 2 === 0 ? "teal" : "coral",
    };
    if (activeFolder) {
      setNotebookFolderMap((folders) => ({ ...folders, [notebook.id]: activeFolder }));
    }

    setNotebooks((items) => {
      const updated = [notebook, ...items];
      try {
        const lightweight = updated.slice(0, 25).map((item) => ({
          ...item,
          content: item.content.length > 300_000 ? item.content.slice(0, 300_000) : item.content,
        }));
        localStorage.setItem("synapse_local_notebooks", JSON.stringify(lightweight));
      } catch (error) {
        console.warn("LocalStorage quota reached, keeping notebook in active session:", error);
      }
      return updated;
    });

    setActiveNotebookWorkspaceId(notebook.id);
    setToolNotebookId(notebook.id);
    switchToChat(notebook.id);
    setYoutubeOpen(false);
    setYoutubeUrl("");
    setChatYoutubeOpen(false);
    setChatYoutubeUrl("");
    setNotice(
      source.truncated
        ? "Notebook created. The source text was shortened to fit storage limit."
        : `Processed “${title}” (${source.wordCount ?? "complete"} words). Switched to chat!`,
    );
  }

  async function createAiTopicNotebook(title: string) {
    const content = `AI topic notebook: ${title}. No uploaded source. Teach this topic from general knowledge.`;
    let notebookId = crypto.randomUUID();
    let createdAt = new Date().toISOString();
    let savedToCloud = false;

    try {
      const { data, error } = await createClient()
        .from("study_notebooks")
        .insert({
          title,
          source_name: "AI topic",
          source_type: "text",
          content,
        })
        .select("id, created_at")
        .single();
      if (error) throw error;
      if (data) {
        notebookId = data.id;
        createdAt = data.created_at;
        savedToCloud = true;
      }
    } catch (error) {
      console.warn("Could not save AI topic notebook to Supabase; keeping it in this browser:", error);
    }

    const notebook: Notebook = {
      id: notebookId,
      title,
      subtitle: "AI topic · no uploaded source",
      content,
      sourceType: "topic",
      notes: 0,
      opened: new Date(createdAt).toLocaleDateString(),
      createdAt,
      symbol: "✳",
      accent: notebooks.length % 2 === 0 ? "teal" : "coral",
    };
    setNotebooks((items) => {
      const updated = [notebook, ...items];
      try {
        localStorage.setItem("synapse_local_notebooks", JSON.stringify(updated.slice(0, 25)));
      } catch (error) {
        console.warn("Could not cache the AI topic notebook locally:", error);
      }
      return updated;
    });
    return { notebook, savedToCloud };
  }

  async function addStudyFile(file: File) {
    setIsIngesting(true);
    setNotice(`Reading ${file.name}…`);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/study/ingest", { method: "POST", body: formData });
      const result = await response.json() as {
        error?: string;
        content?: string;
        sourceName?: string;
        sourceType?: string;
        truncated?: boolean;
        wordCount?: number;
      };
      if (!response.ok) throw new Error(result.error || "Could not read this file.");
      if (!result.content || !result.sourceName || !result.sourceType) {
        throw new Error("The source parser returned incomplete data.");
      }
      await createNotebookFromSource(result as { content: string; sourceName: string; sourceType: string; truncated?: boolean; wordCount?: number });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not process this study source.");
    } finally {
      setIsIngesting(false);
    }
  }

  async function importYouTubeSource(videoUrl: string) {
    if (isIngesting) return;
    setIsIngesting(true);
    setNotice("Getting captions from YouTube…");
    try {
      const formData = new FormData();
      formData.append("youtubeUrl", videoUrl);
      const response = await fetch("/api/study/ingest", { method: "POST", body: formData });
      const result = await response.json() as {
        error?: string;
        content?: string;
        sourceName?: string;
        sourceType?: string;
        truncated?: boolean;
        wordCount?: number;
      };
      if (!response.ok) throw new Error(result.error || "Could not get a transcript from this YouTube video.");
      if (!result.content || !result.sourceName || !result.sourceType) {
        throw new Error("YouTube returned an empty transcript. Check that captions are available for the video.");
      }
      await createNotebookFromSource(result as { content: string; sourceName: string; sourceType: string; truncated?: boolean; wordCount?: number });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not import this YouTube video.");
    } finally {
      setIsIngesting(false);
    }
  }

  async function openNotebook(notebook: Notebook) {
    if (typeof window !== "undefined" && window.innerWidth <= 820) {
      setSidebarCollapsed(true);
    }
    setActiveNotebookWorkspaceId(notebook.id);
    setToolNotebookId(notebook.id);
    switchToChat(notebook.id);
  }

  function openNotebookModule(module: "Chat" | "Notes" | "Flashcards" | "Quiz") {
    if (typeof window !== "undefined" && window.innerWidth <= 820) {
      setSidebarCollapsed(true);
    }
    const notebookId = activeNotebookWorkspaceId;
    if (!notebookId) return;
    setToolNotebookId(notebookId);
    if (module === "Chat") {
      switchToChat(notebookId);
    } else {
      setActiveNav(module);
    }
  }

  function switchToChat(notebookId: string | null) {
    if (activeNav === "Chat" && chatContextId === notebookId) return;
    setChatMessages([]);
    setChatThreadId(notebookId ? `thread-${notebookId}` : "general-chat");
    setIsLoadingChat(false);
    setChatContextId(notebookId);
    setActiveNav("Chat");
  }

  async function sendChatMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = chatPrompt.trim();
    if (!message || isSendingMessage || isLoadingChat) return;

    const currentNotebook = notebooks.find((item) => item.id === chatContextId);
    const topicTitle = chatContextId ? null : inferStudyTopic(message);
    const threadId = chatThreadId || (chatContextId ? `thread-${chatContextId}` : "general-chat");

    setChatPrompt("");
    setIsSendingMessage(true);
    const optimisticMessage: StudyMessage = { id: crypto.randomUUID(), role: "user", content: message };
    setChatMessages((items) => [...items, optimisticMessage]);

    try {
      const response = await fetch("/api/study/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId,
          notebookId: chatContextId,
          message,
          sourceContent: currentNotebook?.sourceType === "topic" ? "" : currentNotebook?.content,
          notebookTitle: currentNotebook?.title,
          previousMessages: chatMessages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const result = await response.json() as { answer?: string; error?: string; threadId?: string; citations?: string[] };
      if (!response.ok) throw new Error(result.error || "Could not get an answer.");
      if (!result.answer) throw new Error("The AI returned an empty response.");

      if (result.threadId && result.threadId !== chatThreadId) {
        setChatThreadId(result.threadId);
      }

      const assistantMessage: StudyMessage = { id: crypto.randomUUID(), role: "assistant", content: result.answer };
      if (result.citations?.length) {
        setCitationSourcesByMessageId((sources) => ({ ...sources, [assistantMessage.id]: result.citations! }));
      }
      setChatMessages((items) => [...items, assistantMessage]);

      if (topicTitle) {
        try {
          const { notebook, savedToCloud } = await createAiTopicNotebook(topicTitle);
          let notebookThreadId = `thread-${notebook.id}`;
          if (savedToCloud) {
            const threadResponse = await fetch(`/api/study/chat?notebookId=${encodeURIComponent(notebook.id)}`, { cache: "no-store" });
            const threadResult = await threadResponse.json() as { error?: string; threadId?: string };
            if (!threadResponse.ok) throw new Error(threadResult.error || "Could not open the new topic notebook.");
            notebookThreadId = threadResult.threadId ?? notebookThreadId;
            if (!notebookThreadId.startsWith("thread-") && !notebookThreadId.startsWith("general-")) {
              const { error } = await createClient().from("study_chat_entries").insert([
                { thread_id: notebookThreadId, role: "user", content: message },
                { thread_id: notebookThreadId, role: "assistant", content: result.answer },
              ]);
              if (error) throw new Error("The notebook was created, but its opening lesson could not be saved.");
            }
          }

          setActiveNotebookWorkspaceId(notebook.id);
          setToolNotebookId(notebook.id);
          setChatContextId(notebook.id);
          setChatThreadId(notebookThreadId);
          setActiveNav("Chat");
          setChatMessages([optimisticMessage, assistantMessage]);
          setNotice(`Created the “${topicTitle}” AI topic notebook. No source was uploaded.`);
        } catch (error) {
          setNotice(error instanceof Error
            ? `Your answer is ready, but the topic notebook could not be created: ${error.message}`
            : "Your answer is ready, but the topic notebook could not be created.");
        }
      }
    } catch (error) {
      setChatMessages((items) => items.filter((item) => item.id !== optimisticMessage.id));
      setChatPrompt(message);
      setNotice(error instanceof Error ? error.message : "Could not send your message.");
    } finally {
      setIsSendingMessage(false);
    }
  }

  async function generateStudyTool(module: "notes" | "flashcards" | "quiz") {
    if (!toolNotebookId || isGenerating) return;
    const currentNotebook = notebooks.find((item) => item.id === toolNotebookId);
    setIsGenerating(true);
    try {
      const response = await fetch("/api/study/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module,
          notebookId: toolNotebookId,
          sourceContent: currentNotebook?.content,
          notebookTitle: currentNotebook?.title,
          difficulty: toolDifficulty,
          count: toolCount,
        }),
      });
      const result = await response.json() as {
        error?: string;
        title?: string;
        content?: string;
        cards?: Flashcard[];
        questions?: QuizQuestion[];
      };
      if (!response.ok) throw new Error(result.error || "Could not generate study material.");

      const client = createClient();
      if (module === "notes") {
        if (!result.title || !result.content) throw new Error("The AI returned incomplete notes.");
        const notesHtml = markdownToNotesHtml(result.content);
        try {
          await client.from("study_notes").upsert({
            notebook_id: toolNotebookId,
            title: result.title,
            content: notesHtml,
            updated_at: new Date().toISOString(),
          }, { onConflict: "user_id,notebook_id" });
        } catch (err) {
          console.warn("Could not upsert notes to Supabase:", err);
        }
        setNotesTitle(result.title);
        setNotesContent(notesHtml);
        setNotesCharacterCount(new DOMParser().parseFromString(notesHtml, "text/html").body.textContent?.length ?? 0);
        if (notesEditorRef.current) notesEditorRef.current.innerHTML = notesHtml;
        setActiveNav("Notes");
        setNotice("Notes generated and saved. Edit them any time.");
      } else if (module === "flashcards") {
        if (!result.title || !result.cards?.length) throw new Error("The AI returned an incomplete flashcard deck.");
        let deck: FlashcardDeck = {
          id: crypto.randomUUID(),
          notebook_id: toolNotebookId,
          title: result.title,
          difficulty: toolDifficulty,
          cards: result.cards,
          created_at: new Date().toISOString(),
        };
        try {
          const { data, error } = await client.from("study_flashcard_decks").insert({
            notebook_id: toolNotebookId,
            title: result.title,
            difficulty: toolDifficulty,
            cards: result.cards,
          }).select("*").single();
          if (!error && data) deck = data as FlashcardDeck;
        } catch (err) {
          console.warn("Could not insert deck to Supabase:", err);
        }
        setFlashcardDecks((items) => [deck, ...items]);
        setCurrentDeck(deck);
        setCardIndex(0);
        setShowCardBack(false);
        setNotice("Flashcards generated and saved to your library.");
      } else {
        if (!result.title || !result.questions?.length) throw new Error("The AI returned an incomplete quiz.");
        let attempt: QuizAttempt = {
          id: crypto.randomUUID(),
          notebook_id: toolNotebookId,
          title: result.title,
          difficulty: toolDifficulty,
          questions: result.questions,
          answers: [],
          score: null,
          feedback: null,
          completed_at: null,
        };
        try {
          const { data, error } = await client.from("study_quiz_attempts").insert({
            notebook_id: toolNotebookId,
            title: result.title,
            difficulty: toolDifficulty,
            questions: result.questions,
            answers: [],
          }).select("*").single();
          if (!error && data) attempt = data as QuizAttempt;
        } catch (err) {
          console.warn("Could not insert quiz to Supabase:", err);
        }
        setQuizAttempts((items) => [attempt, ...items]);
        setCurrentQuiz(attempt);
        setQuizAnswers(Array.from({ length: attempt.questions.length }, () => -1));
        setNotice("Quiz ready. Your answers will update your study notes when you submit.");
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not generate study material.");
    } finally {
      setIsGenerating(false);
    }
  }

  function formatNotes(command: "bold" | "underline" | "foreColor" | "hiliteColor", value?: string) {
    const editor = notesEditorRef.current;
    if (!editor) return;
    editor.focus();
    if (notesSelectionRef.current && editor.contains(notesSelectionRef.current.commonAncestorContainer)) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(notesSelectionRef.current);
    }
    document.execCommand(command, false, value);
    notesSelectionRef.current = window.getSelection()?.rangeCount
      ? window.getSelection()!.getRangeAt(0).cloneRange()
      : null;
    setNotesContent(sanitizeNotesHtml(editor.innerHTML));
    setNotesCharacterCount(editor.innerText.length);
  }

  function applyNotesFontSize(size: string) {
    const editor = notesEditorRef.current;
    if (!editor) return;
    editor.focus();
    if (notesSelectionRef.current && editor.contains(notesSelectionRef.current.commonAncestorContainer)) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(notesSelectionRef.current);
    }
    document.execCommand("fontSize", false, "7");
    editor.querySelectorAll('font[size="7"]').forEach((font) => {
      const span = document.createElement("span");
      span.style.fontSize = size;
      span.innerHTML = font.innerHTML;
      font.replaceWith(span);
    });
    notesSelectionRef.current = window.getSelection()?.rangeCount
      ? window.getSelection()!.getRangeAt(0).cloneRange()
      : null;
    setNotesFontSize(size);
    setNotesContent(sanitizeNotesHtml(editor.innerHTML));
    setNotesCharacterCount(editor.innerText.length);
  }

  async function saveNotes() {
    if (!toolNotebookId || isSavingNotes) return;
    setIsSavingNotes(true);
    try {
      const content = sanitizeNotesHtml(notesEditorRef.current?.innerHTML ?? notesContent);
      const title = notesTitle.trim()
        || `${notebooks.find((item) => item.id === toolNotebookId)?.title ?? "Study"} · Notes`;
      const { error } = await createClient().from("study_notes").upsert({
        notebook_id: toolNotebookId,
        title,
        content,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,notebook_id" });
      if (error) throw new Error("Could not save your notes. Run the latest Supabase migration.");
      setNotesContent(content);
      setNotesCharacterCount(new DOMParser().parseFromString(content, "text/html").body.textContent?.length ?? 0);
      if (notesEditorRef.current) notesEditorRef.current.innerHTML = content;
      setNotesTitle(title);
      setNotice("Your notes are saved.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not save your notes.");
    } finally {
      setIsSavingNotes(false);
    }
  }

  function downloadNotes() {
    const content = sanitizeNotesHtml(notesEditorRef.current?.innerHTML ?? notesContent);
    if (!content.trim()) {
      setNotice("There are no notes to download yet.");
      return;
    }
    const blob = new Blob([
      `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(notesTitle || "Study notes")}</title></head><body><h1>${escapeHtml(notesTitle || "Study notes")}</h1>${content}</body></html>`,
    ], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(notesTitle || "synapse-notes").replace(/[^\w-]+/g, "-")}.html`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function submitQuiz(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentQuiz || currentQuiz.completed_at || isSubmittingQuiz) return;
    setIsSubmittingQuiz(true);
    try {
      const response = await fetch("/api/study/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "grade-quiz", attemptId: currentQuiz.id, answers: quizAnswers }),
      });
      const result = await response.json() as {
        error?: string;
        score?: number;
        feedback?: string;
        updatedNotes?: string;
        warning?: string;
      };
      if (!response.ok && response.status !== 207) {
        throw new Error(result.error || "Could not submit this quiz.");
      }
      if (typeof result.score !== "number" || !result.feedback || !result.updatedNotes) {
        throw new Error(result.error || "The quiz feedback was incomplete.");
      }
      const updatedQuiz = {
        ...currentQuiz,
        answers: quizAnswers,
        score: result.score,
        feedback: result.feedback,
        completed_at: new Date().toISOString(),
      };
      setCurrentQuiz(updatedQuiz);
      setQuizAttempts((items) => items.map((item) => item.id === updatedQuiz.id ? updatedQuiz : item));
      if (toolNotebookId === currentQuiz.notebook_id) {
        setNotesTitle((title) => title || `${notebooks.find((item) => item.id === toolNotebookId)?.title ?? "Study"} · Study notes`);
        const notesHtml = markdownToNotesHtml(result.updatedNotes);
        setNotesContent(notesHtml);
        setNotesCharacterCount(new DOMParser().parseFromString(notesHtml, "text/html").body.textContent?.length ?? 0);
        if (notesEditorRef.current) notesEditorRef.current.innerHTML = notesHtml;
      }
      setNotice(result.warning ?? "Quiz graded. Synapse updated your notes with the concepts to revisit.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not submit this quiz.");
    } finally {
      setIsSubmittingQuiz(false);
    }
  }

  async function deleteFlashcardDeck(deckId: string) {
    const { error } = await createClient().from("study_flashcard_decks").delete().eq("id", deckId);
    if (error) {
      setNotice("Could not delete this flashcard set.");
      return;
    }
    setFlashcardDecks((items) => items.filter((item) => item.id !== deckId));
    if (currentDeck?.id === deckId) setCurrentDeck(null);
    setNotice("Flashcard set deleted.");
  }

  function createNotebookFolder() {
    const folderName = window.prompt("Name your folder");
    if (!folderName?.trim()) return;
    const cleanName = folderName.trim().slice(0, 60);
    if (notebookFolders.some((folder) => folder.toLowerCase() === cleanName.toLowerCase())) {
      setNotice("A folder with that name already exists.");
      return;
    }
    setNotebookFolders((folders) => [...folders, cleanName]);
    setActiveFolder(cleanName);
    setActiveNav("Notebooks");
  }

  function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = taskTitle.trim();
    if (!title) return;
    setTasks((items) => [{
      id: crypto.randomUUID(),
      title: title.slice(0, 180),
      status: taskStatus,
      priority: taskPriority,
      dueDate: taskDueDate,
      createdAt: new Date().toISOString(),
    }, ...items]);
    setTaskTitle("");
    setTaskDueDate("");
    setTaskStatus("To Do");
  }

  function updateTask(taskId: string, updates: Partial<StudyTask>) {
    setTasks((items) => items.map((task) => task.id === taskId ? { ...task, ...updates } : task));
  }

  function toggleTask(task: StudyTask) {
    updateTask(task.id, {
      status: task.status === "Completed" ? "To Do" : "Completed",
    });
  }

  async function copyAssistantMessage(message: StudyMessage) {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopiedMessageId(message.id);
      window.setTimeout(() => setCopiedMessageId(""), 1600);
    } catch {
      setNotice("Clipboard access is unavailable in this browser.");
    }
  }

  function openCitation(messageId: string, number: number) {
    setCitationSelection({
      messageId,
      number,
      text: citationSourcesByMessageId[messageId]?.[number - 1]
        ?? "This citation excerpt is not available for this saved response.",
    });
  }

  async function saveAssistantToNotes(message: StudyMessage) {
    if (!chatContextId) {
      setNotice("Select a notebook to save this explanation to its notes.");
      return;
    }
    const notebook = notebooks.find((item) => item.id === chatContextId);
    if (!notebook) return;
    const client = createClient();
    const { data: savedNotes, error: readError } = await client
      .from("study_notes")
      .select("title, content")
      .eq("notebook_id", notebook.id)
      .maybeSingle();
    if (readError) {
      setNotice("Could not load notes. Run the latest Supabase migration.");
      return;
    }
    const title = savedNotes?.title ?? `${notebook.title} · Notes`;
    const appendedHtml = `<hr><h2>Saved from study chat</h2><p>${escapeHtml(message.content.trim()).replace(/\r?\n/g, "<br>")}</p>`;
    const content = sanitizeNotesHtml([savedNotes?.content.trim(), appendedHtml].filter(Boolean).join(""));
    const { error } = await client.from("study_notes").upsert({
      notebook_id: notebook.id,
      title,
      content,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,notebook_id" });
    if (error) {
      setNotice("Could not save to notes. Run the latest Supabase migration.");
      return;
    }
    setToolNotebookId(notebook.id);
    setNotesTitle(title);
    setNotesContent(content);
    setNotesCharacterCount(new DOMParser().parseFromString(content, "text/html").body.textContent?.length ?? 0);
    if (notesEditorRef.current) notesEditorRef.current.innerHTML = content;
    setNotice("Explanation added to this notebook’s notes.");
  }

  function handlePromptSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = prompt.trim();
    if (!title) return;
    setChatPrompt(title);
    switchToChat(null);
  }

  function addYouTubeSource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!youtubeUrl.trim() || isIngesting) return;
    if (!/^https?:\/\/(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be)\//i.test(youtubeUrl.trim())) {
      setNotice("Enter a valid YouTube video link to create a notebook.");
      return;
    }
    void importYouTubeSource(youtubeUrl.trim());
  }

  function addChatYouTubeSource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!chatYoutubeUrl.trim() || isIngesting) return;
    if (!/^https?:\/\/(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be)\//i.test(chatYoutubeUrl.trim())) {
      setNotice("Enter a valid YouTube video link to create a notebook.");
      return;
    }
    setChatAttachOpen(false);
    void importYouTubeSource(chatYoutubeUrl.trim());
    setChatYoutubeUrl("");
    setChatYoutubeOpen(false);
  }

  async function signOut() {
    setIsSigningOut(true);
    try {
      const { error } = await createClient().auth.signOut();
      if (error) throw error;
      router.replace("/");
      router.refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not sign out. Please try again.");
      setIsSigningOut(false);
    }
  }

  function chooseNavigation(label: string) {
    if (typeof window !== "undefined" && window.innerWidth <= 820) {
      setSidebarCollapsed(true);
    }
    setActiveNav(label);
    if (label === "Chat") {
      setActiveNotebookWorkspaceId(null);
      switchToChat(null);
      return;
    }
    if (label === "Home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (label === "Notebooks") {
      return;
    }
  }

  return (
    <main className="dashboard-shell" ref={dashboardRef} data-sidebar-collapsed={sidebarCollapsed}>
      {/* Mobile sidebar toggle */}
      <button
        className="mobile-sidebar-toggle"
        type="button"
        aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        onClick={() => setSidebarCollapsed((c) => !c)}
        aria-expanded={!sidebarCollapsed}
      >
        <Icon name={sidebarCollapsed ? "menu" : "x"} size={22} />
      </button>

      {/* Mobile sidebar backdrop */}
      {!sidebarCollapsed && (
        <div
          className="mobile-sidebar-backdrop"
          onClick={() => setSidebarCollapsed(true)}
          aria-hidden="true"
        />
      )}

      <aside className="dashboard-sidebar" ref={sidebarRef}>
        <div className="sidebar-header">
          <a className="dashboard-brand" href="/dashboard" aria-label="Synapse AI Study home">
            <span className="dashboard-brand-mark"><Icon name="spark" size={22} /></span>
            <span className="brand-text">Synapse AI Study</span>
          </a>
          <button
            className="sidebar-collapse-btn"
            type="button"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!sidebarCollapsed}
            onClick={() => setSidebarCollapsed((c) => !c)}
            title={sidebarCollapsed ? "Expand" : "Collapse"}
          >
            <span className="sidebar-collapse-icon">
              <Icon name="chevron" size={16} />
            </span>
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Workspace navigation">
          {navigation.map((item) => (
            <button
              className={`sidebar-link${activeNav === item.label ? " active" : ""}`}
              type="button"
              key={item.label}
              onClick={() => chooseNavigation(item.label)}
            >
              <Icon name={item.icon} size={19} />
              <span className="sidebar-link-label">{item.label}</span>
              {item.label === "Chat" && !sidebarCollapsed && <span className="nav-new">AI</span>}
              {item.label === "Tasks" && pendingTaskCount > 0 && <span className="nav-task-count">{pendingTaskCount}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-spacer" />

        {!sidebarCollapsed && (
          <>
            <div className="sidebar-note">
              <span className="sidebar-note-icon"><Icon name="spark" size={16} /></span>
              <p>Small steps.<br /><b>Big dreams.</b></p>
              <span className="sidebar-note-spark">✳</span>
            </div>
            <div className="sidebar-footer">
              <span className="open-source-mark">✳</span>
              <span><b>Open source</b><small>Built by learners, for learners.</small></span>
              <span className="coral-heart">♥</span>
            </div>
          </>
        )}
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="topbar-crumb">
            <span className="crumb-home"><Icon name="home" size={15} /></span>
            <span>{activeNav}</span>
          </div>
          <div className="topbar-actions">
            <ThemeToggle />
            <div className="profile-wrap">
              <button
                type="button"
                className="profile-button"
                aria-label="Open account menu"
                aria-expanded={profileOpen}
                onClick={() => setProfileOpen((open) => !open)}
              >
                <ProfileAvatar name={name} avatarUrl={avatarUrl} size={32} />
                <span className="profile-name">{name}</span>
                <Icon name="chevron" size={15} />
              </button>
              {profileOpen && (
                <div className="profile-menu">
                  <div className="profile-menu-header">
                    <ProfileAvatar name={name} avatarUrl={avatarUrl} size={48} />
                    <div className="profile-menu-info">
                      <b>{name}</b>
                      <span><Icon name="mail" size={14} /> {email}</span>
                      <span className="profile-provider"><Icon name="globe" size={14} /> {provider} account</span>
                    </div>
                  </div>
                  <div className="profile-menu-divider" />
                  <button type="button" onClick={signOut} disabled={isSigningOut}>
                    <Icon name="logout" size={15} /> {isSigningOut ? "Signing out…" : "Sign out"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          <input
            ref={fileInputRef}
            className="sr-only"
            type="file"
            accept=".pdf,.pptx,.ppt,.pps,.ppsx,.odp,.docx,.doc,.odt,.rtf,.txt,.md,.markdown,.csv,.xlsx,.epub,.mp4,.mpeg,.webm,.mov"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (file) void addStudyFile(file);
              event.currentTarget.value = "";
            }}
          />
          {activeNav === "Notebooks" ? (
            <section className="workspace-module">
              <div className="workspace-module-heading">
                <div>
                  <span className="dashboard-eyebrow"><span /> YOUR LESSON LIBRARY</span>
                  <h1>All your <span>notebooks.</span></h1>
                  <p>Pick up where you left off, or open a notebook to study its chat, notes, flashcards, and quizzes.</p>
                </div>
                <button className="module-primary-button" type="button" disabled={isIngesting} onClick={() => fileInputRef.current?.click()}>
                  <Icon name="plus" size={16} /> New notebook
                </button>
              </div>
              <div className="folder-filter-row">
                <button className={`folder-filter-pill${!activeFolder ? " active" : ""}`} type="button" onClick={() => setActiveFolder("")}>All notebooks</button>
                {notebookFolders.map((folder) => (
                  <button className={`folder-filter-pill${activeFolder === folder ? " active" : ""}`} type="button" key={folder} onClick={() => setActiveFolder(folder)}>
                    <Icon name="folder" size={14} /> {folder}
                  </button>
                ))}
                <button className="folder-filter-pill folder-add-pill" type="button" onClick={createNotebookFolder}><Icon name="plus" size={14} /> New folder</button>
              </div>
              <div className="notebook-tools">
                <label className="notebook-search">
                  <Icon name="search" size={17} />
                  <input aria-label="Search notebooks" placeholder="Search notebooks..." value={search} onChange={(event) => setSearch(event.target.value)} />
                </label>
              </div>
              {folderNotebooks.length ? (
                <div className="notebooks-grid">
                  {folderNotebooks.map((notebook) => (
                    <div className="notebook-card-entry" key={notebook.id}>
                      <NotebookCard notebook={notebook} onOpen={() => void openNotebook(notebook)} />
                      <select
                        aria-label={`Folder for ${notebook.title}`}
                        value={notebookFolderMap[notebook.id] ?? ""}
                        onChange={(event) => setNotebookFolderMap((folders) => ({ ...folders, [notebook.id]: event.target.value }))}
                      >
                        <option value="">No folder</option>
                        {notebookFolders.map((folder) => <option key={folder} value={folder}>{folder}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="module-empty-state">
                  {activeFolder
                    ? `No notebooks in “${activeFolder}” yet. Upload a source while this folder is selected to organize it here.`
                    : isLoadingNotebooks ? "Loading your notebooks…" : "No notebooks yet. Upload a PDF, slides, notes, or lecture video to create your first one."}
                </div>
              )}
            </section>
          ) : activeNav === "Tasks" ? (
            <section className="workspace-module">
              <div className="tasks-page-heading">
                <div>
                  <span className="dashboard-eyebrow"><span /> YOUR STUDY PLANNER</span>
                  <h1>Make time for <span>what matters.</span></h1>
                  <p>A clear view of what&apos;s next, what&apos;s due, and what you&apos;ve finished.</p>
                </div>
                <span className="tasks-date-pill"><Icon name="clock" size={15} /> {new Date().toLocaleDateString(undefined, { weekday: "short", month: "long", day: "numeric" })}</span>
              </div>
              <div className="task-summary-grid">
                <article><span>Open tasks</span><b>{pendingTaskCount}</b></article>
                <article><span>Due today</span><b>{tasks.filter((task) => task.status !== "Completed" && task.dueDate === todayKey).length}</b></article>
                <article><span>Completed</span><b>{tasks.filter((task) => task.status === "Completed").length}</b></article>
              </div>
              <form className="task-create-form" onSubmit={createTask}>
                <label className="task-title-field"><span>New task</span><input aria-label="Task title" placeholder="e.g. Review chapter 4 notes" value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} maxLength={180} required /></label>
                <div className="task-create-details">
                  <label><span>Due date</span><input aria-label="Task due date" type="date" value={taskDueDate} onChange={(event) => setTaskDueDate(event.target.value)} /></label>
                  <label><span>Priority</span><select aria-label="Task priority" value={taskPriority} onChange={(event) => setTaskPriority(event.target.value as StudyTask["priority"])}>
                    <option>High</option><option>Medium</option><option>Low</option>
                  </select></label>
                  <label><span>Status</span><select aria-label="Task status" value={taskStatus} onChange={(event) => setTaskStatus(event.target.value as StudyTask["status"])}>
                    <option>To Do</option><option>In Progress</option><option>Completed</option>
                  </select></label>
                  <button className="module-primary-button" type="submit"><Icon name="plus" size={15} /> Add task</button>
                </div>
              </form>
              <div className="task-filter-tabs">
                {(["All", "Today", "Upcoming", "Completed"] as const).map((filter) => (
                  <button type="button" key={filter} className={taskFilter === filter ? "active" : ""} onClick={() => setTaskFilter(filter)}>
                    {filter}{filter === "All" ? ` · ${tasks.length}` : filter === "Completed" ? ` · ${tasks.filter((task) => task.status === "Completed").length}` : ""}
                  </button>
                ))}
              </div>
              <div className="task-list">
                {!filteredTasks.length ? <div className="module-empty-state">Nothing in this view yet. Add a task to keep your next study step in sight.</div> : filteredTasks.map((task) => (
                  <article className={`task-list-item${task.status === "Completed" ? " completed" : ""}`} key={task.id}>
                    <button className="task-checkbox" type="button" aria-label={task.status === "Completed" ? "Mark task as incomplete" : "Mark task as complete"} aria-pressed={task.status === "Completed"} onClick={() => toggleTask(task)}>
                      {task.status === "Completed" && <Icon name="check" size={13} />}
                    </button>
                    <span className="task-list-title">{task.title}</span>
                    <span className={`task-priority-tag ${task.priority.toLowerCase()}`}>{task.priority}</span>
                    <span className={`task-due-date${task.dueDate && task.dueDate < todayKey && task.status !== "Completed" ? " overdue" : ""}`}>
                      {task.dueDate ? new Date(`${task.dueDate}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "No due date"}
                    </span>
                    <select className={`task-status-select ${task.status.toLowerCase().replaceAll(" ", "-")}`} aria-label={`Status for ${task.title}`} value={task.status} onChange={(event) => updateTask(task.id, { status: event.target.value as StudyTask["status"] })}>
                      <option>To Do</option><option>In Progress</option><option>Completed</option>
                    </select>
                    <button className="task-delete-button" type="button" aria-label={`Delete ${task.title}`} onClick={() => setTasks((items) => items.filter((item) => item.id !== task.id))}><Icon name="close" size={14} /></button>
                  </article>
                ))}
              </div>
            </section>
          ) : activeNav === "Focus" ? (
            <section className="workspace-module focus-page">
              <div className="workspace-module-heading">
                <div>
                  <span className="dashboard-eyebrow"><span /> POMODORO FOCUS</span>
                  <h1>One thing at a time<span>.</span></h1>
                  <p>Work in a focused 25-minute session, then recharge with a 5-minute break.</p>
                </div>
              </div>
              <div className={`focus-session-card${focusSession?.phase === "break" ? " is-break" : ""}`}>
                <span className="focus-session-label">
                  <Icon name={focusSession?.phase === "break" ? "spark" : "clock"} size={16} />
                  {focusSession ? (focusSession.phase === "focus" ? "FOCUS SESSION" : "SHORT BREAK") : "READY WHEN YOU ARE"}
                </span>
                <strong className="focus-session-timer" aria-live="polite">
                  {focusSession ? formatFocusTime(focusRemainingMs) : "25:00"}
                </strong>
                <p>
                  {focusSession
                    ? focusSession.phase === "focus"
                      ? "Stay with your task. Your break starts when the timer ends."
                      : "Step away for a moment. Your next focus session starts automatically."
                    : "A little focused time adds up. Start a session whenever you’re ready."}
                </p>
                {focusSession && <span className="focus-cycle-count">{focusSession.cycles} {focusSession.cycles === 1 ? "session" : "sessions"} completed</span>}
                <div className="focus-session-actions">
                  {focusSession ? (
                    <>
                      <button className="module-primary-button" type="button" onClick={toggleFocusSession}>
                        <Icon name={focusSession.endsAt === null ? "play" : "pause"} size={15} />
                        {focusSession.endsAt === null ? "Resume timer" : "Pause timer"}
                      </button>
                      <button className="focus-stop-button" type="button" onClick={endFocusSession}>End session</button>
                    </>
                  ) : (
                    <button className="module-primary-button" type="button" disabled={!focusSessionReady} onClick={startFocusSession}>
                      <Icon name="clock" size={15} /> Start 25-minute focus
                    </button>
                  )}
                </div>
              </div>
            </section>
          ) : activeNav === "Chat" ? (
            <>
            {activeNotebookWorkspaceId && (
              <nav className="notebook-workspace-tabs" aria-label="Notebook tools">
                {(["Chat", "Notes", "Flashcards", "Quiz"] as const).map((module) => (
                  <button type="button" key={module} className={activeNav === module ? "active" : ""} onClick={() => openNotebookModule(module)}>
                    {module}
                  </button>
                ))}
              </nav>
            )}
            <section className="workspace-module study-chat-page">
              <div className="workspace-module-heading">
                <div>
                  <span className="dashboard-eyebrow"><span /> YOUR AI STUDY PARTNER</span>
                  <h1>{chatContextId ? "Study chat" : "Let's figure it out"}<span>.</span></h1>
                  <p>{chatContextId ? `Working in ${notebooks.find((item) => item.id === chatContextId)?.title ?? "your notebook"}. Ask about its content or a related concept.` : "Ask anything, from kinematics to a tricky homework concept. A notebook is optional."}</p>
                </div>
                <div className="module-select-wrapper">
                  <CustomSelect
                    label="Study context"
                    value={chatContextId ?? ""}
                    onChange={(val) => {
                      const id = val || null;
                      setActiveNotebookWorkspaceId(id);
                      if (id) setToolNotebookId(id);
                      switchToChat(id);
                    }}
                    placeholder="General chat · no source"
                    options={[
                      {
                        value: "",
                        label: "General chat · no source",
                        subtitle: "Ask anything from general knowledge",
                        icon: <Icon name="spark" size={14} />,
                      },
                      ...notebooks.map((n) => ({
                        value: n.id,
                        label: n.title,
                        subtitle: n.subtitle,
                        icon: <Icon name="file" size={14} />,
                      })),
                    ]}
                  />
                </div>
              </div>
              <div className="module-chat-panel">
                <div className="module-chat-history" aria-live="polite">
                  {!chatMessages.length && !isLoadingChat && (
                    <div className="module-chat-welcome">
                      <span className="module-chat-spark"><Icon name="spark" size={23} /></span>
                      <b>{chatContextId ? "Ask about your notebook" : "What are you curious about?"}</b>
                      <p>{chatContextId ? "I’ll use your notebook and explain anything it doesn’t cover." : "I can teach a topic from scratch, work through examples, and check your understanding."}</p>
                      <div className="chat-suggestions">
                        {["Explain kinematics simply", "Teach me Newton’s laws", "How do I study more effectively?"].map((suggestion) => (
                          <button type="button" key={suggestion} onClick={() => setChatPrompt(suggestion)}>{suggestion}</button>
                        ))}
                      </div>
                    </div>
                  )}
                  {isLoadingChat && <p className="study-chat-thinking">Opening your saved chat…</p>}
                  {chatMessages.map((message) => (
                    <article className={`study-chat-message ${message.role}`} key={message.id}>
                      <b>{message.role === "user" ? "You" : "Synapse AI"}</b>
                      {message.role === "assistant"
                        ? <div className="chat-message-content">{renderChatMarkdown(message.content, message.id, true, Boolean(citationSourcesByMessageId[message.id]?.length), openCitation)}</div>
                        : <p>{message.content}</p>}
                      {message.role === "assistant" && (
                        <div className="assistant-message-actions">
                          <button type="button" onClick={() => void copyAssistantMessage(message)}>{copiedMessageId === message.id ? "Copied" : "Copy"}</button>
                          {chatContextId && <button type="button" onClick={() => void saveAssistantToNotes(message)}>Save to Notes</button>}
                        </div>
                      )}
                      {citationSelection?.messageId === message.id && (
                        <aside className="citation-preview">
                          <b>Source [{citationSelection.number}]</b>
                          <p>{citationSelection.text}</p>
                          <button type="button" onClick={() => setCitationSelection(null)}>Dismiss</button>
                        </aside>
                      )}
                    </article>
                  ))}
                  {isSendingMessage && <p className="study-chat-thinking">Synapse is thinking…</p>}
                </div>
                {chatYoutubeOpen && (
                  <form className="chat-youtube-import" onSubmit={addChatYouTubeSource}>
                    <Icon name="youtube" size={16} />
                    <input type="url" aria-label="YouTube video URL" placeholder="Paste a YouTube video link" value={chatYoutubeUrl} onChange={(event) => setChatYoutubeUrl(event.target.value)} required disabled={isIngesting} />
                    <button type="submit" disabled={isIngesting || !chatYoutubeUrl.trim()}>{isIngesting ? "Importing…" : "Import"}</button>
                    <button type="button" aria-label="Cancel YouTube import" onClick={() => { setChatYoutubeOpen(false); setChatYoutubeUrl(""); }}><Icon name="close" size={15} /></button>
                  </form>
                )}
                <form className="study-chat-form" onSubmit={sendChatMessage}>
                  <div className="chat-attachment-wrap">
                    <button className={`chat-attachment-button${chatAttachOpen ? " active" : ""}`} type="button" aria-label="Add a study source" aria-expanded={chatAttachOpen} title="Attach a study source" onClick={() => setChatAttachOpen((open) => !open)}><Icon name="pin" size={18} /></button>
                    {chatAttachOpen && (
                      <div className="chat-attachment-menu">
                        <button type="button" disabled={isIngesting} onClick={() => { setChatAttachOpen(false); fileInputRef.current?.click(); }}><Icon name="upload" size={16} /><span><b>Upload file</b><small>PDF, slides, Word or notes</small></span></button>
                        <button type="button" disabled={isIngesting} onClick={() => { setChatAttachOpen(false); setChatYoutubeOpen(true); }}><Icon name="youtube" size={16} /><span><b>YouTube video</b><small>Import video captions</small></span></button>
                      </div>
                    )}
                  </div>
                  <input
                    aria-label="Ask Synapse a question"
                    value={chatPrompt}
                    onChange={(event) => setChatPrompt(event.target.value)}
                    placeholder={chatContextId ? "Ask a question about your notebook…" : "Ask anything you want to understand…"}
                    maxLength={4000}
                    disabled={isLoadingChat || isSendingMessage}
                  />
                  <button type="submit" disabled={!chatPrompt.trim() || isLoadingChat || isSendingMessage}>Send</button>
                </form>
                <small className="module-chat-footnote">Answers are AI-generated. Verify important details with your course materials.</small>
              </div>
            </section>
            </>
          ) : activeNav === "Notes" ? (
            <>
            {activeNotebookWorkspaceId && <nav className="notebook-workspace-tabs" aria-label="Notebook tools">{(["Chat", "Notes", "Flashcards", "Quiz"] as const).map((module) => <button type="button" key={module} className={activeNav === module ? "active" : ""} onClick={() => openNotebookModule(module)}>{module}</button>)}</nav>}
            <section className="workspace-module">
              <div className="workspace-module-heading">
                <div>
                  <span className="dashboard-eyebrow"><span /> YOUR STUDY NOTES</span>
                  <h1>Make the ideas <span>yours.</span></h1>
                  <p>Generate notes from a notebook, edit them here, save them, or download as Markdown.</p>
                </div>
                <div className="module-select-wrapper">
                  <CustomSelect
                    label="Notebook"
                    value={toolNotebookId}
                    onChange={(val) => {
                      setToolNotebookId(val);
                      setActiveNotebookWorkspaceId(val || null);
                    }}
                    disabled={!notebooks.length}
                    placeholder={!notebooks.length ? "Upload a source first" : "Select notebook…"}
                    options={notebooks.map((notebook) => ({
                      value: notebook.id,
                      label: notebook.title,
                      subtitle: notebook.subtitle,
                      icon: <Icon name="file" size={14} />,
                    }))}
                  />
                </div>
              </div>
              {toolNotebookId ? (
                <>
                  <div className="module-toolbar">
                    <button className="module-primary-button" type="button" disabled={isGenerating} onClick={() => void generateStudyTool("notes")}>
                      <Icon name="spark" size={16} /> {isGenerating ? "Generating…" : notesContent ? "Regenerate with AI" : "Generate notes"}
                    </button>
                    <span>AI notes update after quiz feedback too.</span>
                  </div>
                  <div className="notes-editor-card">
                    <input className="notes-title-input" value={notesTitle} onChange={(event) => setNotesTitle(event.target.value)} placeholder="Notes title" aria-label="Notes title" />
                    <div className="notes-format-toolbar" role="toolbar" aria-label="Notes formatting" onMouseDown={() => {
                      const selection = window.getSelection();
                      if (selection?.rangeCount && notesEditorRef.current?.contains(selection.anchorNode)) {
                        notesSelectionRef.current = selection.getRangeAt(0).cloneRange();
                      }
                    }}>
                      <button type="button" aria-label="Bold" title="Bold" onMouseDown={(event: ReactMouseEvent<HTMLButtonElement>) => event.preventDefault()} onClick={() => formatNotes("bold")}><b>B</b></button>
                      <button type="button" aria-label="Underline" title="Underline" onMouseDown={(event: ReactMouseEvent<HTMLButtonElement>) => event.preventDefault()} onClick={() => formatNotes("underline")}><u>U</u></button>
                      <label title="Text size"><span>Size</span>
                        <select value={notesFontSize} onChange={(event) => applyNotesFontSize(event.target.value)} aria-label="Text size">
                          <option value="12px">Small</option><option value="16px">Normal</option><option value="20px">Large</option><option value="28px">Title</option>
                        </select>
                      </label>
                      <label className="notes-color-control" title="Text color"><span>A</span><input type="color" value={notesTextColor} aria-label="Text color" onChange={(event) => setNotesTextColor(event.target.value)} /></label>
                      <button type="button" title="Apply text color" aria-label="Apply text color" onMouseDown={(event: ReactMouseEvent<HTMLButtonElement>) => event.preventDefault()} onClick={() => formatNotes("foreColor", notesTextColor)}><span style={{ color: notesTextColor }}>A</span></button>
                      <label className="notes-color-control" title="Highlight color"><span>▰</span><input type="color" value={notesHighlightColor} aria-label="Highlight color" onChange={(event) => setNotesHighlightColor(event.target.value)} /></label>
                      <button type="button" title="Highlight selection" aria-label="Highlight selection" onMouseDown={(event: ReactMouseEvent<HTMLButtonElement>) => event.preventDefault()} onClick={() => formatNotes("hiliteColor", notesHighlightColor)}>✦</button>
                    </div>
                    <div
                      ref={notesEditorRef}
                      className="notes-editor"
                      contentEditable
                      suppressContentEditableWarning
                      role="textbox"
                      aria-multiline="true"
                      aria-label="Editable study notes"
                      data-placeholder="Choose Generate notes to build study notes from this notebook, or start writing your own…"
                      onInput={(event) => {
                        setNotesContent(sanitizeNotesHtml(event.currentTarget.innerHTML));
                        setNotesCharacterCount(event.currentTarget.innerText.length);
                      }}
                      onPaste={(event) => {
                        event.preventDefault();
                        document.execCommand("insertText", false, event.clipboardData.getData("text/plain"));
                      }}
                    />
                    <div className="notes-editor-footer">
                      <span>{notesCharacterCount.toLocaleString()} characters · Saved to your account</span>
                      <div>
                        <button className="module-secondary-button" type="button" onClick={downloadNotes}>Download .html</button>
                        <button className="module-primary-button" type="button" disabled={isSavingNotes} onClick={() => void saveNotes()}>{isSavingNotes ? "Saving…" : "Save notes"}</button>
                      </div>
                    </div>
                  </div>
                </>
              ) : <div className="module-empty-state">Upload a PDF, presentation, or notes file to create a notebook before generating notes.</div>}
            </section>
            </>
          ) : activeNav === "Flashcards" ? (
            <>
            {activeNotebookWorkspaceId && <nav className="notebook-workspace-tabs" aria-label="Notebook tools">{(["Chat", "Notes", "Flashcards", "Quiz"] as const).map((module) => <button type="button" key={module} className={activeNav === module ? "active" : ""} onClick={() => openNotebookModule(module)}>{module}</button>)}</nav>}
            <section className="workspace-module">
              <div className="workspace-module-heading">
                <div>
                  <span className="dashboard-eyebrow"><span /> ACTIVE RECALL</span>
                  <h1>Remember more, <span>effortlessly.</span></h1>
                  <p>Create and keep flashcard decks from your notebooks. Your saved decks will be here next time.</p>
                </div>
                <div className="module-select-wrapper">
                  <CustomSelect
                    label="Notebook"
                    value={toolNotebookId}
                    onChange={(val) => {
                      setToolNotebookId(val);
                      setActiveNotebookWorkspaceId(val || null);
                    }}
                    disabled={!notebooks.length}
                    placeholder={!notebooks.length ? "Upload a source first" : "Select notebook…"}
                    options={notebooks.map((notebook) => ({
                      value: notebook.id,
                      label: notebook.title,
                      subtitle: notebook.subtitle,
                      icon: <Icon name="file" size={14} />,
                    }))}
                  />
                </div>
              </div>
              <div className="module-toolbar module-generator-controls">
                <CustomSelect
                  label="Difficulty"
                  value={toolDifficulty}
                  onChange={(val) => setToolDifficulty(val as "easy" | "medium" | "hard")}
                  options={[
                    { value: "easy", label: "Easy · Foundational" },
                    { value: "medium", label: "Medium · Standard" },
                    { value: "hard", label: "Hard · Advanced" },
                  ]}
                />
                <label>Cards
                  <input type="number" min={3} max={20} value={toolCount} onChange={(event) => setToolCount(Math.min(20, Math.max(3, Number(event.target.value))))} />
                </label>
                <button className="module-primary-button" type="button" disabled={!toolNotebookId || isGenerating} onClick={() => void generateStudyTool("flashcards")}>
                  <Icon name="spark" size={16} /> {isGenerating ? "Creating…" : "Create flashcards"}
                </button>
              </div>
              {currentDeck && (
                <div className="flashcard-overlay" role="dialog" aria-modal="true" aria-label={`${currentDeck.title} flashcards`}>
                  <header className="flashcard-overlay-header">
                    <span><small>FLASHCARD DECK</small><b>{currentDeck.title}</b></span>
                    <button type="button" aria-label="Close flashcards" title="Close · Esc" onClick={() => setCurrentDeck(null)}><Icon name="close" size={19} /></button>
                  </header>
                  <div className="flashcard-overlay-content">
                    <div className="flashcard-overlay-progress"><span>{showCardBack ? "ANSWER" : "QUESTION"}</span><b>{String(cardIndex + 1).padStart(2, "0")} <i>/</i> {String(currentDeck.cards.length).padStart(2, "0")}</b></div>
                    <button className={`flashcard-fullscreen-card${showCardBack ? " answer" : ""}`} type="button" onClick={() => setShowCardBack((visible) => !visible)} aria-label="Flip flashcard">
                      <small>{showCardBack ? "ANSWER" : "QUESTION"}</small>
                      <span>{showCardBack ? currentDeck.cards[cardIndex]?.back : currentDeck.cards[cardIndex]?.front}</span>
                      <em>Click to flip</em>
                    </button>
                    <div className="flashcard-overlay-controls">
                      <button type="button" aria-label="Previous flashcard" title="Previous · ←" disabled={cardIndex === 0} onClick={() => { setCardIndex((index) => Math.max(0, index - 1)); setShowCardBack(false); }}>←</button>
                      <span>Use ← → to navigate <i>·</i> Space to flip <i>·</i> Esc to close</span>
                      <button type="button" aria-label="Next flashcard" title="Next · →" disabled={cardIndex >= currentDeck.cards.length - 1} onClick={() => { setCardIndex((index) => Math.min(currentDeck.cards.length - 1, index + 1)); setShowCardBack(false); }}>→</button>
                    </div>
                  </div>
                </div>
              )}
              <div className="saved-study-sets">
                <h2>Saved decks <span>{flashcardDecks.length}</span></h2>
                {!flashcardDecks.length ? <p className="module-empty-state">No saved decks yet. Generate one to keep it in your library.</p> : (
                  <div className="saved-study-list">
                    {flashcardDecks.map((deck) => (
                      <article className={`saved-study-item${currentDeck?.id === deck.id ? " selected" : ""}`} key={deck.id}>
                        <button type="button" className="saved-study-open" onClick={() => { setCurrentDeck(deck); setCardIndex(0); setShowCardBack(false); }}>
                          <Icon name="cards" size={18} /><span><b>{deck.title}</b><small>{deck.cards.length} cards · {deck.difficulty} · {new Date(deck.created_at).toLocaleDateString()}</small></span>
                        </button>
                        <button type="button" className="study-delete-button" aria-label={`Delete ${deck.title}`} onClick={() => void deleteFlashcardDeck(deck.id)}><Icon name="close" size={16} /></button>
                      </article>
                    ))}
                  </div>
                )}
              </div>
              {!notebooks.length && <div className="module-empty-state">Upload a study source before creating flashcards.</div>}
            </section>
            </>
          ) : activeNav === "Quiz" ? (
            <>
            {activeNotebookWorkspaceId && <nav className="notebook-workspace-tabs" aria-label="Notebook tools">{(["Chat", "Notes", "Flashcards", "Quiz"] as const).map((module) => <button type="button" key={module} className={activeNav === module ? "active" : ""} onClick={() => openNotebookModule(module)}>{module}</button>)}</nav>}
            <section className="workspace-module">
              <div className="workspace-module-heading">
                <div>
                  <span className="dashboard-eyebrow"><span /> PRACTICE & GROW</span>
                  <h1>Learn from every <span>question.</span></h1>
                  <p>Choose a notebook, set the level and length, then Synapse will teach from your results and update your notes.</p>
                </div>
                <div className="module-select-wrapper">
                  <CustomSelect
                    label="Notebook"
                    value={toolNotebookId}
                    onChange={(val) => {
                      setToolNotebookId(val);
                      setActiveNotebookWorkspaceId(val || null);
                    }}
                    disabled={!notebooks.length}
                    placeholder={!notebooks.length ? "Upload a source first" : "Select notebook…"}
                    options={notebooks.map((notebook) => ({
                      value: notebook.id,
                      label: notebook.title,
                      subtitle: notebook.subtitle,
                      icon: <Icon name="file" size={14} />,
                    }))}
                  />
                </div>
              </div>
              <div className="module-toolbar module-generator-controls">
                <CustomSelect
                  label="Difficulty"
                  value={toolDifficulty}
                  onChange={(val) => setToolDifficulty(val as "easy" | "medium" | "hard")}
                  options={[
                    { value: "easy", label: "Easy · Foundational" },
                    { value: "medium", label: "Medium · Standard" },
                    { value: "hard", label: "Hard · Advanced" },
                  ]}
                />
                <label>Questions
                  <input type="number" min={3} max={20} value={toolCount} onChange={(event) => setToolCount(Math.min(20, Math.max(3, Number(event.target.value))))} />
                </label>
                <button className="module-primary-button" type="button" disabled={!toolNotebookId || isGenerating} onClick={() => void generateStudyTool("quiz")}>
                  <Icon name="spark" size={16} /> {isGenerating ? "Preparing…" : "Generate quiz"}
                </button>
              </div>
              {currentQuiz && (
                <form className="quiz-attempt-card" onSubmit={submitQuiz}>
                  <div className="quiz-attempt-heading"><div><h2>{currentQuiz.title}</h2><span>{currentQuiz.difficulty} · {currentQuiz.questions.length} questions</span></div>
                    {currentQuiz.completed_at && <b className="quiz-score">{currentQuiz.score}%</b>}
                  </div>
                  {currentQuiz.questions.map((question, questionIndex) => (
                    <fieldset className="quiz-question" key={`${currentQuiz.id}-${questionIndex}`}>
                      <legend>{questionIndex + 1}. {question.question}</legend>
                      {question.options.map((option, optionIndex) => (
                        <label
                          className={`quiz-option${currentQuiz.completed_at && optionIndex === question.answerIndex ? " correct" : ""}${currentQuiz.completed_at && quizAnswers[questionIndex] === optionIndex && optionIndex !== question.answerIndex ? " incorrect" : ""}`}
                          key={`${questionIndex}-${optionIndex}`}
                        >
                          <input type="radio" name={`question-${questionIndex}`} value={optionIndex} checked={quizAnswers[questionIndex] === optionIndex} disabled={Boolean(currentQuiz.completed_at)} onChange={() => setQuizAnswers((answers) => answers.map((answer, index) => index === questionIndex ? optionIndex : answer))} />
                          <span>{option}</span>
                        </label>
                      ))}
                      {currentQuiz.completed_at && <p className="quiz-explanation">{question.explanation}</p>}
                    </fieldset>
                  ))}
                  {!currentQuiz.completed_at ? (
                    <button className="module-primary-button" type="submit" disabled={isSubmittingQuiz || quizAnswers.some((answer) => answer < 0)}>
                      {isSubmittingQuiz ? "Reviewing your answers…" : "Submit quiz & get feedback"}
                    </button>
                  ) : (
                    <div className="quiz-ai-feedback"><b>Synapse’s feedback</b><p>{currentQuiz.feedback}</p><small>Your notes were updated with the concepts to revisit.</small></div>
                  )}
                </form>
              )}
              <div className="saved-study-sets">
                <h2>Quiz history <span>{quizAttempts.length}</span></h2>
                {!quizAttempts.length ? <p className="module-empty-state">Your completed quizzes stay here, with your scores and learning notes.</p> : (
                  <div className="saved-study-list">
                    {quizAttempts.map((attempt) => (
                      <button className={`saved-study-item saved-quiz-item${currentQuiz?.id === attempt.id ? " selected" : ""}`} type="button" key={attempt.id} onClick={() => {
                        setCurrentQuiz(attempt);
                        setQuizAnswers(attempt.answers?.length ? attempt.answers : Array.from({ length: attempt.questions.length }, () => -1));
                      }}>
                        <Icon name="quiz" size={18} /><span><b>{attempt.title}</b><small>{attempt.questions.length} questions · {attempt.difficulty} · {attempt.completed_at ? `${attempt.score}%` : "Not submitted"}</small></span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {!notebooks.length && <div className="module-empty-state">Upload a study source before creating a quiz.</div>}
            </section>
            </>
          ) : (
            <>
          {focusSession && (
            <section className={`focus-home-widget${focusSession.phase === "break" ? " is-break" : ""}`} aria-label="Active focus session">
              <button className="focus-widget-copy" type="button" onClick={() => setActiveNav("Focus")}>
                <span className="focus-widget-icon"><Icon name={focusSession.phase === "focus" ? "clock" : "spark"} size={19} /></span>
                <span className="focus-widget-text">
                  <b>{focusSession.phase === "focus" ? "Focus session in progress" : "Break time"}</b>
                  <small>{focusSession.endsAt === null ? "Paused · pick up when you’re ready" : focusSession.phase === "focus" ? "Stay focused — your break is coming up" : "Recharge — your next session starts automatically"}</small>
                </span>
                <strong className="focus-widget-timer">{formatFocusTime(focusRemainingMs)}</strong>
                <span className="focus-widget-link">Open <Icon name="arrow" size={14} /></span>
              </button>
              <button className="focus-widget-control" type="button" onClick={toggleFocusSession}>
                {focusSession.endsAt === null ? "Resume" : "Pause"}
              </button>
              <button className="focus-widget-control focus-widget-end" type="button" onClick={endFocusSession}>End</button>
            </section>
          )}
          <section className="dashboard-welcome dashboard-reveal">
            <div className="welcome-copy">
              <span className="dashboard-eyebrow"><span /> YOUR STUDY SPACE, IN SYNC</span>
              <div className="welcome-art-wrap">
                <div className="welcome-art-orbit orbit-a"><span className="orbit-satellite sat-lime" /></div>
                <div className="welcome-art-orbit orbit-b"><span className="orbit-satellite sat-cyan" /></div>
                <div className="welcome-art-orbit orbit-c"><span className="orbit-satellite sat-orange" /></div>
                <StudyIllustration />
              </div>
              <h1>What do you want to learn<span>?</span></h1>
              <p>Bring your class materials into one calm workspace. Your next little win starts here.</p>
            </div>
          </section>

          <section className="study-prompt-card dashboard-reveal" aria-label="Start learning">
            <form className="prompt-form" onSubmit={handlePromptSubmit}>
              <input
                aria-label="What would you like to learn"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="how do planes fly"
              />
              <div className="prompt-actions">
                <div className="home-attach-wrap">
                  <button className={`home-attach-button${homeAttachOpen ? " active" : ""}`} type="button" disabled={isIngesting} aria-label="Attach study material" aria-expanded={homeAttachOpen} onClick={() => setHomeAttachOpen((open) => !open)}>
                    <Icon name="pin" size={17} /><span>Add source</span>
                  </button>
                  {homeAttachOpen && <div className="home-attach-menu">
                    <button type="button" disabled={isIngesting} onClick={() => { setHomeAttachOpen(false); fileInputRef.current?.click(); }}><Icon name="upload" size={16} /> Upload a file</button>
                    <button type="button" onClick={() => { setHomeAttachOpen(false); setYoutubeOpen((open) => !open); }}><Icon name="youtube" size={16} /> YouTube video</button>
                  </div>}
                </div>
                <span className="prompt-hint">/</span>
              <button className="prompt-submit" type="submit" aria-label="Start learning" disabled={!prompt.trim()}>
                <Icon name="arrow" size={20} />
              </button>
            </div>
            </form>
            {youtubeOpen && (
              <form className="youtube-form" onSubmit={addYouTubeSource}>
                <input type="url" aria-label="YouTube video URL" placeholder="Paste a YouTube video link" value={youtubeUrl} onChange={(event) => setYoutubeUrl(event.target.value)} required disabled={isIngesting} />
                <button type="submit" disabled={isIngesting}>{isIngesting ? "Getting transcript…" : "Import video"} <Icon name="arrow" size={15} /></button>
              </form>
            )}
          </section>

          {recentNotebook && (
            <button className="resume-banner" type="button" onClick={() => void openNotebook(recentNotebook)}>
              <span className="resume-icon"><Icon name="clock" size={17} /></span>
              <span className="resume-label">RECENT ACTIVITY</span>
              <b>{recentNotebook.title}</b>
              <span className="resume-chapter">· Ch. 1</span>
              <span className="resume-link">Jump back in <Icon name="arrow" size={15} /></span>
            </button>
          )}

          <section className="agenda-widget dashboard-reveal">
            <div className="agenda-heading">
              <div><span className="dashboard-eyebrow"><span /> STAY ON TRACK</span><h2>Today&apos;s Agenda &amp; Deadlines</h2></div>
              <button type="button" onClick={() => setActiveNav("Tasks")}>View all tasks <Icon name="arrow" size={14} /></button>
            </div>
            {!urgentTasks.length ? <p className="agenda-empty">You&apos;re all clear for today. Add a task to keep your deadlines in view.</p> : (
              <div className="agenda-task-list">
                {urgentTasks.map((task) => (
                  <article className={`agenda-task${task.status === "Completed" ? " completed" : ""}`} key={task.id}>
                    <button className="task-checkbox" type="button" aria-label={task.status === "Completed" ? "Mark task as incomplete" : "Mark task as complete"} aria-pressed={task.status === "Completed"} onClick={() => toggleTask(task)}>
                      {task.status === "Completed" && <Icon name="check" size={13} />}
                    </button>
                    <span className="agenda-task-title">{task.title}</span>
                    <span className={`task-priority-tag ${task.priority.toLowerCase()}`}>{task.priority}</span>
                    <span className={`agenda-deadline${task.dueDate < todayKey ? " overdue" : ""}`}>{task.dueDate < todayKey ? "Overdue" : "Today"}</span>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="notebooks-section dashboard-reveal" id="notebooks">
            <div className="notebooks-heading">
              <div className="notebooks-title">
                <span className="notebooks-title-icon"><Icon name="book" size={22} /></span>
                <div>
                  <h2>Notebooks</h2>
                  <p>Your sources stay organized and ready for study.</p>
                </div>
              </div>
              <div className="notebook-tools">
                <button className="new-notebook-button secondary" type="button" onClick={createNotebookFolder}>
                  <Icon name="folder" size={16} /> New folder
                </button>
                <button className="new-notebook-button" type="button" disabled={isIngesting} onClick={() => fileInputRef.current?.click()}>
                  <Icon name="plus" size={17} /> New notebook
                </button>
              </div>
            </div>
            {homeNotebooks.length ? (
              <div className="notebooks-grid">
                {homeNotebooks.map((notebook) => (
                  <NotebookCard key={notebook.id} notebook={notebook} onOpen={() => void openNotebook(notebook)} />
                ))}
              </div>
            ) : (
              <div className="notebooks-empty">
                <div className="empty-mascot-icon">
                  <Icon name={notebooks.length ? "search" : "upload"} size={30} />
                </div>
                <b>{notebooks.length ? "No notebooks match your search" : "Your study space is ready"}</b>
                <span>
                  {isLoadingNotebooks
                    ? "Loading your saved notebooks…"
                    : notebooks.length
                      ? "Try another search, or clear the search field to see your sources."
                      : "You haven't created any notebooks yet. Upload a lecture PDF, slides, notes, or a document to build your first study notebook."}
                </span>
                {!notebooks.length && !isLoadingNotebooks && (
                  <div className="empty-actions">
                    <button className="empty-source-button" type="button" onClick={() => fileInputRef.current?.click()}>
                      <Icon name="upload" size={15} /> Upload PDF or Slides
                    </button>
                    <button className="empty-source-button empty-source-button-alt" type="button" onClick={() => { setYoutubeOpen(true); window.scrollTo({ top: 300, behavior: "smooth" }); }}>
                      <Icon name="youtube" size={15} /> Paste YouTube Video
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
            </>
          )}

          {notice && (
            <div className="dashboard-toast" role="status">
              <Icon name="spark" size={16} /><span>{notice}</span><button type="button" aria-label="Dismiss message" onClick={() => setNotice("")}><Icon name="close" size={16} /></button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}