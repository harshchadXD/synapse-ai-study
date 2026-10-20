"use client";

import { useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
  | "clock"
  | "file"
  | "upload"
  | "youtube"
  | "mic"
  | "spark"
  | "chevron"
  | "dots"
  | "close"
  | "logout";

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
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8M8 17h6" /></>,
    upload: <><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 16v4h16v-4" /></>,
    youtube: <><rect x="3" y="5" width="18" height="14" rx="4" /><path d="m10 9 5 3-5 3V9Z" fill="currentColor" stroke="none" /></>,
    mic: <><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6" /></>,
    spark: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" /><path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    dots: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></>,
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
  title: string;
  subtitle: string;
  notes: number;
  opened: string;
  symbol: string;
  accent: "teal" | "coral";
};

const initialNotebooks: Notebook[] = [
  { title: "Mathematics", subtitle: "Class 10 · Algebra", notes: 18, opened: "Opened today", symbol: "∑", accent: "teal" },
  { title: "Science", subtitle: "Class 10 · Biology", notes: 24, opened: "Opened 2h ago", symbol: "✳", accent: "coral" },
  { title: "English", subtitle: "Class 10 · Literature", notes: 12, opened: "Opened yesterday", symbol: "Aa", accent: "teal" },
  { title: "Social studies", subtitle: "Class 10 · History", notes: 16, opened: "Opened 2d ago", symbol: "⌂", accent: "coral" },
  { title: "Hindi", subtitle: "Class 10 · Grammar", notes: 9, opened: "Opened 3d ago", symbol: "अ", accent: "teal" },
  { title: "Computer science", subtitle: "Class 10 · AI basics", notes: 14, opened: "Opened 4d ago", symbol: "⌘", accent: "coral" },
];

const navigation: { label: string; icon: IconName }[] = [
  { label: "Home", icon: "home" },
  { label: "Notebooks", icon: "book" },
  { label: "Chat", icon: "chat" },
  { label: "Flashcards", icon: "cards" },
  { label: "Quiz", icon: "quiz" },
  { label: "Sources", icon: "folder" },
];

function StudyIllustration() {
  return (
    <svg className="study-illustration" viewBox="0 0 240 190" fill="none" aria-hidden="true">
      <ellipse cx="117" cy="160" rx="83" ry="12" fill="#BFE9E2" />
      <path d="M44 127c27-17 115-20 150 0l-20 26H62l-18-26Z" fill="#15998B" />
      <path d="M61 128c20-12 91-14 116 0l-12 13H72l-11-13Z" fill="#EAF8F5" />
      <path d="M82 118c2-28 15-48 39-48 26 0 37 23 38 49l-14 14H96l-14-15Z" fill="#F47765" />
      <path d="M90 90c2-21 14-34 33-34 21 0 34 16 34 38l-11-9-8-18-23 15-19 2-6 12V90Z" fill="#174E5A" />
      <path d="M101 98c3-3 7-3 10 0M128 98c3-3 7-3 10 0" stroke="#174E5A" strokeWidth="3" strokeLinecap="round" />
      <path d="M110 111c5 4 11 4 16 0" stroke="#174E5A" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M82 118 67 137m91-19 15 19" stroke="#174E5A" strokeWidth="9" strokeLinecap="round" />
      <path d="M109 126v16m17-16v16" stroke="#174E5A" strokeWidth="8" strokeLinecap="round" />
      <path d="M95 135h44" stroke="#F47765" strokeWidth="4" strokeLinecap="round" />
      <path d="m47 58 4 9 9 4-9 4-4 9-4-9-9-4 9-4 4-9Z" fill="#F5A28E" />
      <path d="m188 48 3 6 6 3-6 3-3 6-3-6-6-3 6-3 3-6Z" fill="#15998B" />
      <path d="M182 91h20a8 8 0 0 1 8 8v7a8 8 0 0 1-8 8h-8l-7 7v-7h-5a8 8 0 0 1-8-8v-7a8 8 0 0 1 8-8Z" fill="#FFFDFC" stroke="#C7E9E3" strokeWidth="2" />
      <circle cx="186" cy="102" r="2" fill="#15998B" /><circle cx="193" cy="102" r="2" fill="#15998B" /><circle cx="200" cy="102" r="2" fill="#15998B" />
      <circle cx="67" cy="49" r="3" fill="#15998B" /><circle cx="170" cy="38" r="4" fill="#F5A28E" />
    </svg>
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

export default function DashboardHome({
  name,
  email,
  provider,
}: {
  name: string;
  email: string;
  provider: string;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notebooks, setNotebooks] = useState(initialNotebooks);
  const [search, setSearch] = useState("");
  const [prompt, setPrompt] = useState("");
  const [youtubeOpen, setYoutubeOpen] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [notice, setNotice] = useState("");
  const [activeNav, setActiveNav] = useState("Home");
  const [profileOpen, setProfileOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const visibleNotebooks = useMemo(
    () => notebooks.filter((notebook) =>
      `${notebook.title} ${notebook.subtitle}`.toLowerCase().includes(search.toLowerCase()),
    ),
    [notebooks, search],
  );

  function createNotebook(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = prompt.trim();
    if (!title) return;
    const notebookTitle = title.length > 32 ? `${title.slice(0, 32).trim()}…` : title;
    setNotebooks((items) => [
      {
        title: notebookTitle,
        subtitle: "New notebook · Just now",
        notes: 0,
        opened: "Created just now",
        symbol: "✳",
        accent: "teal",
      },
      ...items,
    ]);
    setPrompt("");
    setNotice(`“${notebookTitle}” is ready to start in this demo.`);
    document.getElementById("notebooks")?.scrollIntoView({ behavior: "smooth" });
  }

  function addYouTubeSource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!youtubeUrl.trim()) return;
    setNotice("Video link added to this demo session. Source processing will connect here.");
    setYoutubeUrl("");
    setYoutubeOpen(false);
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
    setActiveNav(label);
    if (label === "Home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (label === "Notebooks") {
      document.getElementById("notebooks")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    setNotice(`${label} is part of your Synapse workspace. This module is coming soon.`);
  }

  return (
    <main className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <a className="dashboard-brand" href="/dashboard" aria-label="Synapse home">
          <span className="dashboard-brand-mark"><Icon name="spark" size={22} /></span>
          <span>synapse<span>.</span></span>
        </a>

        <div className="sidebar-label">WORKSPACE</div>
        <nav className="sidebar-nav" aria-label="Workspace navigation">
          {navigation.map((item) => (
            <button
              className={`sidebar-link${activeNav === item.label ? " active" : ""}`}
              type="button"
              key={item.label}
              onClick={() => chooseNavigation(item.label)}
            >
              <Icon name={item.icon} size={19} />
              <span>{item.label}</span>
              {item.label === "Chat" && <span className="nav-new">AI</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-spacer" />
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
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="topbar-crumb"><span className="crumb-home"><Icon name="home" size={15} /></span><span>Home</span></div>
          <div className="topbar-actions">
            <span className="account-provider"><span className="account-dot" /> {provider} account</span>
            <div className="profile-wrap">
              <button
                type="button"
                className="profile-button"
                aria-label="Open account menu"
                aria-expanded={profileOpen}
                onClick={() => setProfileOpen((open) => !open)}
              >
                <span className="profile-avatar">{name.charAt(0).toUpperCase()}</span>
                <span className="profile-name">{name}</span>
                <Icon name="chevron" size={15} />
              </button>
              {profileOpen && (
                <div className="profile-menu">
                  <b>{name}</b>
                  <span>{email}</span>
                  <button type="button" onClick={signOut} disabled={isSigningOut}>
                    <Icon name="logout" size={15} /> {isSigningOut ? "Signing out…" : "Sign out"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          <section className="dashboard-welcome">
            <div className="welcome-copy">
              <span className="dashboard-eyebrow"><span /> YOUR STUDY SPACE, IN SYNC</span>
              <h1>What do you want<br className="welcome-break" /> to learn<span>?</span></h1>
              <p>Pick up where you left off, or start something new. Your next little win starts here.</p>
            </div>
            <div className="welcome-art-wrap">
              <div className="welcome-art-orbit orbit-a" />
              <div className="welcome-art-orbit orbit-b" />
              <StudyIllustration />
              <div className="welcome-speech">Let&apos;s learn!</div>
            </div>
            <div className="encouragement-card">
              <span className="encouragement-icon"><Icon name="spark" size={18} /></span>
              <span><b>Keep going, {name}.</b><small>Small steps. Big dreams.</small></span>
              <span className="encouragement-bars"><i /><i /><i /></span>
            </div>
          </section>

          <section className="study-prompt-card" aria-label="Start learning">
            <div className="prompt-tip"><Icon name="spark" size={16} /><span>Tip: upload a lecture or paste a YouTube link to get started</span></div>
            <form className="prompt-form" onSubmit={createNotebook}>
              <input
                aria-label="What would you like to learn"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="What would you like to learn today?"
              />
              <button className="prompt-submit" type="submit" aria-label="Start learning" disabled={!prompt.trim()}>
                <Icon name="arrow" size={20} />
              </button>
            </form>
            <div className="prompt-actions">
              <button className="source-action record-action" type="button" onClick={() => setNotice("Live recording is coming soon. You can upload a lecture file for now.")}><Icon name="mic" size={16} /> Record</button>
              <button className="source-action" type="button" onClick={() => fileInputRef.current?.click()}><Icon name="upload" size={16} /> Upload</button>
              <input
                ref={fileInputRef}
                className="sr-only"
                type="file"
                accept=".pdf,.ppt,.pptx,.doc,.docx,.txt"
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];
                  if (file) setNotice(`${file.name} selected. File storage and study generation will connect here.`);
                  event.currentTarget.value = "";
                }}
              />
              <button className={`source-action${youtubeOpen ? " selected" : ""}`} type="button" onClick={() => setYoutubeOpen((open) => !open)}><Icon name="youtube" size={16} /> YouTube</button>
              <span className="prompt-hint">PDF, slides, notes & more</span>
            </div>
            {youtubeOpen && (
              <form className="youtube-form" onSubmit={addYouTubeSource}>
                <input type="url" aria-label="YouTube video URL" placeholder="Paste a YouTube video link" value={youtubeUrl} onChange={(event) => setYoutubeUrl(event.target.value)} required />
                <button type="submit">Add link <Icon name="arrow" size={15} /></button>
              </form>
            )}
          </section>

          <button className="resume-banner" type="button" onClick={() => setNotice("Resuming “Electric charges & forces” — lesson view is coming soon.")}>
            <span className="resume-icon"><Icon name="book" size={18} /></span>
            <span className="resume-label">PICK UP WHERE YOU LEFT OFF</span>
            <b>Electric Charges &amp; Forces: Coulomb&apos;s Law</b>
            <span className="resume-chapter">Chapter 3</span>
            <span className="resume-link">Jump back in <Icon name="arrow" size={16} /></span>
          </button>

          <section className="notebooks-section" id="notebooks">
            <div className="notebooks-heading">
              <div className="notebooks-title"><span className="notebooks-title-icon"><Icon name="book" size={22} /></span><div><h2>Your notebooks</h2><p>A little progress, one subject at a time.</p></div></div>
              <div className="notebook-tools">
                <label className="notebook-search"><Icon name="search" size={17} /><input aria-label="Search notebooks" placeholder="Search notebooks..." value={search} onChange={(event) => setSearch(event.target.value)} />{search && <button type="button" onClick={() => setSearch("")} aria-label="Clear search"><Icon name="close" size={15} /></button>}</label>
                <button className="new-notebook-button" type="button" onClick={() => { document.querySelector<HTMLInputElement>(".prompt-form input")?.focus(); window.scrollTo({ top: 0, behavior: "smooth" }); }}><Icon name="plus" size={18} /> New notebook</button>
              </div>
            </div>
            {visibleNotebooks.length ? (
              <div className="notebooks-grid">
                {visibleNotebooks.map((notebook) => <NotebookCard key={notebook.title} notebook={notebook} onOpen={() => setNotice(`${notebook.title} notebook opened in preview mode.`)} />)}
              </div>
            ) : (
              <div className="notebooks-empty"><Icon name="search" size={22} /><b>No notebooks found</b><span>Try another subject name.</span></div>
            )}
          </section>

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
