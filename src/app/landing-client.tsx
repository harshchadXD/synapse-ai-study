"use client";

import { useState, useEffect, useRef, useCallback, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/theme-provider";

type IconName =
  | "arrow"
  | "arrow-left"
  | "spark"
  | "book"
  | "play"
  | "check"
  | "clock"
  | "network"
  | "layers"
  | "eye"
  | "mail"
  | "google"
  | "lock"
  | "chevron";

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  const paths: Record<IconName, ReactNode> = {
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    "arrow-left": <><path d="M19 12H5" /><path d="m11 18-6-6 6-6" /></>,
    spark: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" /><path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" /></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5v-12Z" /><path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H20M8 7h7M8 10h5" /></>,
    play: <polygon points="7 4 19 12 7 20 7 4" fill="currentColor" />,
    check: <><path d="m5 12 4 4L19 6" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    network: <><circle cx="12" cy="5" r="2" /><circle cx="6" cy="18" r="2" /><circle cx="18" cy="18" r="2" /><path d="m11 7-4 9M13 7l4 9M8 18h8" /></>,
    layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></>,
    eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    google: <><path d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.8 3-4.3 3-7.3Z" fill="currentColor" stroke="none" /><path d="M12 22c2.7 0 5-.9 6.7-2.5l-3.2-2.5c-.9.6-2 .9-3.5.9-2.7 0-5-1.8-5.8-4.3H2.9v2.6A10 10 0 0 0 12 22Z" fill="currentColor" stroke="none" opacity=".72" /><path d="M6.2 13.6a6 6 0 0 1 0-3.2V7.8H2.9a10 10 0 0 0 0 8.4l3.3-2.6Z" fill="currentColor" stroke="none" opacity=".52" /><path d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.9-2.9C16.9 3.1 14.7 2 12 2a10 10 0 0 0-9.1 5.8l3.3 2.6c.8-2.5 3.1-4.3 5.8-4.3Z" fill="currentColor" stroke="none" opacity=".84" /></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 1 1 8 0v3M12 14v3" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
  };

  return <svg {...common}>{paths[name]}</svg>;
}

/* ─── LOADING SCREEN ─── */
function LoadingScreen({ onFinished }: { onFinished: () => void }) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"loading" | "revealing" | "done">("loading");

  useEffect(() => {
    // Smooth progress animation over ~1.8s
    const start = performance.now();
    const duration = 1800;
    let raf: number;

    function tick(now: number) {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      // Ease-out cubic for satisfying feel
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(Math.round(eased * 100));

      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        // Begin reveal phase
        setPhase("revealing");
        setTimeout(() => {
          setPhase("done");
          onFinished();
        }, 600);
      }
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onFinished]);

  if (phase === "done") return null;

  return (
    <div className={`loading-screen ${phase === "revealing" ? "is-revealing" : ""}`}>
      {/* Ambient orbs */}
      <div className="loader-orb loader-orb-1" />
      <div className="loader-orb loader-orb-2" />
      <div className="loader-orb loader-orb-3" />

      {/* Particle field */}
      <div className="loader-particles">
        {Array.from({ length: 30 }, (_, i) => (
          <span
            key={i}
            className="loader-particle"
            style={{
              left: `${(i * 37.7 + 11) % 100}%`,
              top: `${(i * 61.3 + 7) % 100}%`,
              animationDelay: `${(i * 0.37) % 3}s`,
              animationDuration: `${2 + ((i * 0.53) % 3)}s`,
            }}
          />
        ))}
      </div>

      {/* Central content */}
      <div className="loader-content">
        {/* Animated rings */}
        <div className="loader-rings">
          <div className="loader-ring loader-ring-outer" />
          <div className="loader-ring loader-ring-middle" />
          <div className="loader-ring loader-ring-inner" />
        </div>

        {/* Brand icon */}
        <div className="loader-brand">
          <div className="loader-brand-icon">
            <Icon name="spark" size={28} />
          </div>
          <span className="loader-brand-text">Synapse AI Study</span>
        </div>

        {/* Progress bar */}
        <div className="loader-progress">
          <div className="loader-progress-track">
            <div
              className="loader-progress-fill"
              style={{ width: `${progress}%` }}
            />
            <div
              className="loader-progress-glow"
              style={{ left: `${progress}%` }}
            />
          </div>
          <span className="loader-progress-text">{progress}%</span>
        </div>

        {/* Status text */}
        <p className="loader-status">
          {progress < 30
            ? "Initializing your study space…"
            : progress < 60
              ? "Loading AI tools…"
              : progress < 90
                ? "Preparing workspace…"
                : "Almost ready…"}
        </p>
      </div>

      {/* Scan line */}
      <div className="loader-scanline" />
    </div>
  );
}

/* ─── MAGNETIC CURSOR GLOW (follows mouse on feature cards) ─── */
function useCardGlow() {
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty("--glow-x", `${x}px`);
    card.style.setProperty("--glow-y", `${y}px`);
  }, []);

  return { onMouseMove: handleMouseMove };
}

function Brand({ onClick }: { onClick: () => void }) {
  return (
    <button className="brand" type="button" onClick={onClick} aria-label="Synapse AI Study home">
      <span className="brand-mark"><Icon name="spark" size={19} /></span>
      <span>Synapse AI Study</span>
    </button>
  );
}

function LandingPage({ onGetStarted }: { onGetStarted: () => void }) {
  const [flashFlipped, setFlashFlipped] = useState(false);
  const [activeUnit, setActiveUnit] = useState<1 | 2 | 3>(1);
  const [quizSelected, setQuizSelected] = useState<number | null>(null);
  const landingRef = useRef<HTMLElement>(null);
  const cardGlow = useCardGlow();

    useEffect(() => {
    const landing = landingRef.current;
    if (!landing) return;

    landing.classList.add("reveal-enabled");

    const elements = Array.from(
      landing.querySelectorAll<HTMLElement>(".reveal-on-scroll"),
    );
    const showEverything = () => {
      elements.forEach((element) => element.classList.add("is-visible"));
    };

    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    ) {
      showEverything();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" },
    );

    elements.forEach((element) => {
      const bounds = element.getBoundingClientRect();
      if (bounds.bottom > 0 && bounds.top < window.innerHeight * 0.7) {
        element.classList.add("is-visible");
      } else {
        observer.observe(element);
      }
    });

    const bentoCards = Array.from(
      landing.querySelectorAll<HTMLElement>(".feature-card"),
    );

    /* ─── Staggered bento card reveals ─── */
    const bentoObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const card = entry.target as HTMLElement;
            card.classList.add("is-revealed");
            bentoObserver.unobserve(card);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" },
    );
    bentoCards.forEach((card, i) => {
      card.style.setProperty("--card-index", String(i));
      bentoObserver.observe(card);
    });

    /* ─── Counter animations on visible numbers ─── */
    const counterEls = landing.querySelectorAll<HTMLElement>("[data-count-to]");
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const target = Number(el.dataset.countTo);
            const duration = 1200;
            const start = performance.now();
            function step(now: number) {
              const t = Math.min((now - start) / duration, 1);
              const eased = 1 - Math.pow(1 - t, 3);
              el.textContent = String(Math.round(eased * target));
              if (t < 1) requestAnimationFrame(step);
            }
            requestAnimationFrame(step);
            counterObserver.unobserve(el);
          }
        });
      },
      { threshold: 0.5 },
    );
    counterEls.forEach((el) => counterObserver.observe(el));

    return () => {
      landing.classList.remove("reveal-enabled");
      observer.disconnect();
      bentoObserver.disconnect();
      counterObserver.disconnect();
    };
  }, []);

  return (
    <main className="landing" ref={landingRef}>
      {/* Topbar */}
      <header className="topbar">
        <Brand onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} />
        <nav className="nav-links" aria-label="Main navigation">
          <a href="#learn-mode">Turbo learn</a>
          <a href="#workspace">The workspace</a>
          <a href="#why-synapse">Why Synapse AI Study?</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div className="topbar-actions">
          <ThemeToggle />
          <button className="nav-cta" type="button" onClick={onGetStarted}>
            Get started <Icon name="arrow" size={15} />
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="live-dot" /> YOUR WHOLE STUDY LIFE, IN SYNC</div>
          <h1>Meet your new<br />favorite study <span>space.</span></h1>
          <p className="hero-description">
            Your notes, AI study tools, and daily plan — finally working together.
            Everything you need to learn well, in one free workspace.
          </p>
          <div className="hero-actions">
            <button className="button-primary" type="button" onClick={onGetStarted}>
              Get started free <Icon name="arrow" size={17} />
            </button>
            <a className="text-link" href="#learn-mode">
              <span className="play-icon"><Icon name="play" size={12} /></span> Take a look around
            </a>
          </div>

          {/* Student Highlight Badge */}
          <div className="social-proof">
            <div className="avatar-stack" aria-hidden="true">
              <span>H</span><span>M</span><span>A</span><span>K</span>
            </div>
            <span>Made for students, <b>not subscriptions.</b></span>
          </div>
        </div>

        {/* Hero Interactive Workspace Preview Card */}
        <div className="hero-art" aria-label="Preview of the Synapse study workspace">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="ambient ambient-one" />
          <div className="ambient ambient-two" />

          <div className="preview-window">
            <div className="preview-topbar">
              <div className="window-dots"><i /><i /><i /></div>
              <span className="preview-title">my study space</span>
              <span className="preview-avatar">H</span>
            </div>
            <div className="preview-body">
              <div className="preview-greeting">
                <span>MONDAY, OCTOBER 19</span>
                <h3>Good morning, Harsh <span>✳</span></h3>
                <p>A little progress goes a long way.</p>
              </div>
              <div className="preview-focus">
                <div className="focus-top">
                  <span className="focus-label"><span className="live-dot" /> FOCUS SESSION</span>
                  <span className="focus-menu">•••</span>
                </div>
                <div className="focus-center">
                  <div className="timer-ring">
                    <span>24:18</span>
                    <small>FOCUS</small>
                  </div>
                  <div className="focus-info">
                    <b>Cell biology</b>
                    <span>Chapter 04 · 1 of 3</span>
                  </div>
                </div>
                <div className="focus-progress"><span /></div>
              </div>
              <div className="preview-bottom">
                <div className="mini-task">
                  <div className="mini-card-icon mint"><Icon name="check" size={14} /></div>
                  <div>
                    <span>TODAY&apos;S PLAN</span>
                    <b>3 of 5 tasks done</b>
                  </div>
                  <Icon name="chevron" size={15} />
                </div>
                <div className="mini-streak">
                  <span>✳</span>
                  <div>
                    <b>7 day streak</b>
                    <small>You&apos;re on a roll</small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="float-chip chip-ai"><span><Icon name="spark" size={14} /></span> Your AI study space</div>
          <div className="float-chip chip-focus"><span className="chip-pulse" /> Focus mode <b>24:18</b></div>
        </div>
      </section>

      {/* TURBO LEARN FEATURE (With smooth scroll-reveal) */}
      <section className="learn-mode-section reveal-on-scroll" id="learn-mode">
        <div className="section-heading">
          <div>
            <span className="section-kicker">TURBO LEARN FEATURE</span>
            <h2>Learn anything from scratch.<br />Unit by unit.</h2>
          </div>
          <p>
            Upload any PDF or lecture slides you know nothing about. Synapse turns them into intuitive verbal lessons with micro-checkpoints so you never feel lost.
          </p>
        </div>

        {/* Clean Unit Tabs */}
        <div className="flex flex-wrap gap-2.5 mb-6">
          <button
            type="button"
            onClick={() => setActiveUnit(1)}
            className={`unit-tab-btn ${activeUnit === 1 ? "active" : ""}`}
          >
            01 / Unit 1: Intuitive Analogy
          </button>
          <button
            type="button"
            onClick={() => setActiveUnit(2)}
            className={`unit-tab-btn ${activeUnit === 2 ? "active" : ""}`}
          >
            02 / Unit 2: Core Mechanism
          </button>
          <button
            type="button"
            onClick={() => setActiveUnit(3)}
            className={`unit-tab-btn ${activeUnit === 3 ? "active" : ""}`}
          >
            03 / Unit 3: Exam Synthesis
          </button>
        </div>

        {/* Dynamic Unit View */}
        <div className="grid md:grid-cols-2 gap-5 p-6 turbo-card">
          <div className="flex flex-col justify-between">
            <div>
              <span className="turbo-kicker block mb-1">
                VERBAL CONCEPT BREAKDOWN
              </span>
              <h3 className="turbo-heading mb-2">
                {activeUnit === 1 && "The Rechargeable Battery: ATP & ADP"}
                {activeUnit === 2 && "The Mitochondrial Wheel: Krebs Cycle"}
                {activeUnit === 3 && "ATP Synthase & Final Yield"}
              </h3>
              <p className="turbo-paragraph mb-6">
                {activeUnit === 1 &&
                  "Think of ATP not as a scary formula, but as a rechargeable phone battery. When you study or run, a phosphate snaps off, delivering energy and leaving you with ADP. Respiration just recharges that battery back up."}
                {activeUnit === 2 &&
                  "Pyruvate from glycolysis enters the mitochondrial matrix. Here, citric acid cycles continuously, gathering high-energy electrons onto NADH shuttles like passengers on a train."}
                {activeUnit === 3 &&
                  "Protons flow through the ATP Synthase rotor like water through a dam turbine, generating up to 34 ATP molecules per glucose."}
              </p>
            </div>

          </div>

          {/* Micro-Checkpoint Quiz */}
          <div className="turbo-quiz-card">
            <div>
              <div className="flex items-center justify-between text-[10px] turbo-study-meta font-semibold mb-2">
                <span>CHECKPOINT QUESTION</span>
                <span className="turbo-kicker">UNIT {activeUnit}</span>
              </div>
              <h4 className="text-xs font-semibold turbo-heading mb-3">
                {activeUnit === 1 && "What happens when ATP releases energy for cellular work?"}
                {activeUnit === 2 && "Where does the Krebs cycle take place in a eukaryotic cell?"}
                {activeUnit === 3 && "What drives ATP Synthase to generate ATP from ADP?"}
              </h4>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setQuizSelected(1)}
                  className={`turbo-quiz-btn ${quizSelected === 1 ? "selected" : ""}`}
                >
                  <span>
                    {activeUnit === 1 && "A. It releases a phosphate group and becomes ADP"}
                    {activeUnit === 2 && "A. Mitochondrial matrix"}
                    {activeUnit === 3 && "A. Proton gradient across the inner membrane"}
                  </span>
                  {quizSelected === 1 && <span className="text-xs font-bold text-emerald-500">✓</span>}
                </button>

                <button
                  type="button"
                  onClick={() => setQuizSelected(2)}
                  className={`turbo-quiz-btn ${quizSelected === 2 ? "border-rose-500/40 bg-rose-500/10 text-rose-500 font-semibold" : ""}`}
                >
                  <span>
                    {activeUnit === 1 && "B. It gains two additional phosphates"}
                    {activeUnit === 2 && "B. Cell membrane exterior"}
                    {activeUnit === 3 && "B. Direct sunlight exposure"}
                  </span>
                  {quizSelected === 2 && <span className="text-xs font-bold text-rose-500">✗</span>}
                </button>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[var(--line)] flex items-center justify-between text-[11px] turbo-study-meta">
              <span>Mastery score: <b className="turbo-kicker">100%</b></span>
              <button type="button" onClick={onGetStarted} className="turbo-kicker hover:underline cursor-pointer">
                Explore all units →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* BENTO GRID (With smooth scroll-reveal) */}
      <section className="feature-section reveal-on-scroll" id="workspace">
        <div className="section-heading">
          <div>
            <span className="section-kicker">ONE SPACE. MANY WAYS TO LEARN.</span>
            <h2>Everything clicks<br className="mobile-break" /> into place.</h2>
          </div>
          <p>
            Bring your learning materials and your day together. Synapse turns what you&apos;re studying into what you need next.
          </p>
        </div>
        <div className="bento-grid">
          {/* Card 1: 3D True Flip Flashcard */}
          <article className="feature-card flash-card" {...cardGlow}>
            <div className="card-topline">
              <span className="feature-icon lime-icon"><Icon name="layers" /></span>
              <span className="card-number">01 / REMEMBER</span>
            </div>
            <div className="flash-visual">
              <div
                className="flashcard-3d-wrapper"
                onClick={() => setFlashFlipped(!flashFlipped)}
                title="Click to flip in 3D!"
              >
                <div className={`flashcard-3d-inner ${flashFlipped ? "is-flipped" : ""}`}>
                  {/* Front Face */}
                  <div className="flashcard-face">
                    <span className="text-[7px] text-[var(--muted)] tracking-wider font-semibold">QUICK RECALL · 01</span>
                    <b className="text-white text-xs block my-1">What is the powerhouse of the cell?</b>
                    <small className="text-[#c3ef83] text-[9px] flex items-center gap-1 font-semibold">
                      <Icon name="spark" size={12} /> Tap to reveal answer
                    </small>
                  </div>
                  {/* Back Face */}
                  <div className="flashcard-face flashcard-face-back">
                    <span className="text-[7px] text-[#c3ef83] tracking-wider font-semibold">ANSWER · 01</span>
                    <b className="text-white text-xs block my-1">Mitochondria (generates ATP through cellular respiration)</b>
                    <small className="text-[#c3ef83] text-[9px] flex items-center gap-1 font-semibold">
                      <Icon name="check" size={12} /> Mastered · Tap to flip
                    </small>
                  </div>
                </div>
              </div>
            </div>
            <div className="feature-copy">
              <h3>Flashcards that stick.</h3>
              <p>Turn your notes into active recall, not another reread.</p>
            </div>
          </article>

          {/* Card 2: Practice Quiz */}
          <article className="feature-card quiz-card" {...cardGlow}>
            <div className="card-topline">
              <span className="feature-icon lime-icon"><Icon name="book" /></span>
              <span className="card-number">02 / PRACTICE</span>
            </div>
            <div className="quiz-visual">
              <div className="quiz-question">
                <span>QUESTION 03 <span>·</span> CELL BIOLOGY</span>
                <b>Where does the Krebs cycle take place?</b>
              </div>
              <div className="quiz-option correct">
                <span>A</span> Mitochondrial matrix <Icon name="check" size={13} />
              </div>
              <div className="quiz-option"><span>B</span> Cytoplasm</div>
              <div className="quiz-option opacity-60"><span>C</span> Inner membrane</div>
            </div>
            <div className="feature-copy">
              <h3>Practice, minus the pressure.</h3>
              <p>Personalized quizzes that help you find what you know.</p>
            </div>
          </article>

          {/* Card 3: Mindmaps */}
          <article className="feature-card mindmap-card" {...cardGlow}>
            <div className="card-topline">
              <span className="feature-icon lime-icon"><Icon name="network" /></span>
              <span className="card-number">03 / CONNECT</span>
            </div>
            <div className="mindmap-visual">
              <div className="map-lines"><i /><i /><i /><i /><i /><i /></div>
              <div className="map-node map-main">Cell<br />energy</div>
              <div className="map-node map-n1">ATP</div>
              <div className="map-node map-n2">Glucose</div>
              <div className="map-node map-n3">Krebs<br />cycle</div>
              <div className="map-node map-n4">Electron<br />transport</div>
            </div>
            <div className="feature-copy">
              <h3>See the bigger picture.</h3>
              <p>Make sense of complex topics with visual mindmaps.</p>
            </div>
          </article>

          {/* Card 4: Notion Tasks & Pomodoro */}
          <article className="feature-card planner-card" {...cardGlow}>
            <div className="card-topline">
              <span className="feature-icon lime-icon"><Icon name="clock" /></span>
              <span className="card-number">04 / MAKE IT HAPPEN</span>
            </div>
            <div className="planner-visual">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-bold text-[var(--muted)]">TODAY&apos;S PLAN</span>
                <span className="text-[9px] text-[#c3ef83] font-bold">20 OCT</span>
              </div>
              <div className="planner-row done">
                <span className="task-check"><Icon name="check" size={10} /></span>
                <span>Review lecture notes</span>
              </div>
              <div className="planner-row">
                <span className="task-check" />
                <span>Cell biology · focus session</span>
              </div>
              <div className="planner-row">
                <span className="task-check" />
                <span>Read chapter 5</span>
              </div>
            </div>
            <div className="feature-copy">
              <h3>A plan that feels doable.</h3>
              <p>Tasks, exam dates, and focus time — all in one calm place.</p>
            </div>
          </article>
        </div>
      </section>

      {/* WHY SYNAPSE? (Changed Anchor & Heading) */}
      <section className="comparison-section reveal-on-scroll" id="why-synapse">
        <div className="section-heading">
          <div>
            <span className="section-kicker">WHY SYNAPSE ?</span>
            <h2>Why pay $20/month for tools<br />that should be free?</h2>
          </div>
          <p>
            Students shouldn&apos;t have their education held behind paywalls. Here is how Synapse compares to paid tools:
          </p>
        </div>

        <div className="table-wrap-card">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--line)] bg-[rgba(255,255,255,0.02)] text-xs text-[var(--muted)]">
                <th className="p-4 font-semibold">Feature</th>
                <th className="p-4 font-bold border-x border-[rgba(22,135,126,0.3)] bg-[rgba(22,135,126,0.06)] text-[var(--lime)]">
                  Synapse (Open Source)
                </th>
                <th className="p-4 font-medium">TurboLearn AI</th>
                <th className="p-4 font-medium">NotebookLM</th>
                <th className="p-4 font-medium">Quizlet Plus</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-[var(--line)] text-[var(--muted)]">
              <tr>
                <td className="p-4 font-semibold text-[var(--foreground)]">Monthly Cost</td>
                <td className="p-4 font-bold border-x border-[rgba(22,135,126,0.3)] bg-[rgba(22,135,126,0.06)] text-[var(--lime)]">
                  $0 Free Forever
                </td>
                <td className="p-4">$19.99 / mo</td>
                <td className="p-4">Free (limited)</td>
                <td className="p-4">$35.99 / yr</td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-[var(--foreground)]">3D Flashcards</td>
                <td className="p-4 font-bold border-x border-[rgba(22,135,126,0.3)] bg-[rgba(22,135,126,0.06)] text-[var(--lime)]">
                  ✓ Unlimited
                </td>
                <td className="p-4">✓ Paywalled exports</td>
                <td className="p-4 text-[var(--faint)]">✗ No flashcards</td>
                <td className="p-4">✓ Paywalled</td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-[var(--foreground)]">Turbo Learn (Step-by-Step)</td>
                <td className="p-4 font-bold border-x border-[rgba(22,135,126,0.3)] bg-[rgba(22,135,126,0.06)] text-[var(--lime)]">
                  ✓ Included
                </td>
                <td className="p-4">✓ Included</td>
                <td className="p-4 text-[var(--faint)]">✗ None</td>
                <td className="p-4 text-[var(--faint)]">✗ None</td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-[var(--foreground)]">Tasks, Calendar & Pomodoro</td>
                <td className="p-4 font-bold border-x border-[rgba(22,135,126,0.3)] bg-[rgba(22,135,126,0.06)] text-[var(--lime)]">
                  ✓ All-in-One
                </td>
                <td className="p-4 text-[var(--faint)]">✗ None</td>
                <td className="p-4 text-[var(--faint)]">✗ None</td>
                <td className="p-4 text-[var(--faint)]">✗ None</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 py-16 border-t border-[var(--line)] reveal-on-scroll" id="faq">
        <div className="text-center mb-10">
          <span className="turbo-kicker block mb-1">QUESTIONS & ANSWERS</span>
          <h2 className="text-2xl font-semibold text-[var(--foreground)]">Frequently asked questions.</h2>
        </div>

        <div className="space-y-3 stagger-children">
          <div className="faq-card-item reveal-on-scroll delay-1">
            <h3 className="text-xs font-semibold text-[var(--foreground)] mb-1">Is Synapse completely free?</h3>
            <p className="text-[11px] text-[var(--muted)] leading-relaxed">
              Yes, 100%. Synapse is open source and built specifically for students who cannot afford paid subscriptions.
            </p>
          </div>
          <div className="faq-card-item reveal-on-scroll delay-2">
            <h3 className="text-xs font-semibold text-[var(--foreground)] mb-1">What can I upload?</h3>
            <p className="text-[11px] text-[var(--muted)] leading-relaxed">
              PDF textbooks, lecture slides, YouTube video links, or your own raw typed notes.
            </p>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="closing-cta reveal-on-scroll">
        <span className="section-kicker">YOUR NEXT CHAPTER STARTS HERE</span>
        <h2>Make room for<br /><span>your best thinking.</span></h2>
        <p>Less tab-switching. More little wins. And a study space that&apos;s yours.</p>
        <button className="button-primary" type="button" onClick={onGetStarted}>
          Get started free <Icon name="arrow" size={17} />
        </button>
      </section>

      {/* Footer */}
      <footer className="footer">
        <Brand onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} />
        <span>Made for the way you learn. © 2026 Synapse</span>
        <button type="button" onClick={onGetStarted}>Get started <Icon name="arrow" size={14} /></button>
      </footer>
    </main>
  );
}

export function LoginPage({
  onBack,
  initialMessage = "",
}: {
  onBack: () => void;
  initialMessage?: string;
}) {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState(initialMessage);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onBack();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onBack]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    try {
      const supabase = createClient();

      if (isSignUp) {
        const fullName = String(formData.get("name") ?? "").trim();
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
          },
        });

        if (error) {
          setMessage(error.message);
          return;
        }

        if (!data.session) {
          setMessage("Account created. Check your email to confirm your address, then sign in.");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setMessage(error.message);
          return;
        }
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to sign in right now. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setMessage("");
    setIsSubmitting(true);

    try {
      const { data, error } = await createClient().auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        setMessage(error.message);
        setIsSubmitting(false);
        return;
      }

      if (!data.url) {
        setMessage("Supabase did not return a Google sign-in URL. Check provider settings.");
        setIsSubmitting(false);
        return;
      }

      window.location.assign(data.url);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to start Google sign-in. Please try again.",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <header className="auth-topbar">
        <Brand onClick={onBack} />
        <div className="auth-topbar-actions">
          <ThemeToggle />
          <button
            type="button"
            className="back-link"
            onClick={onBack}
            title="Return to homepage (Esc)"
          >
            <Icon name="arrow-left" size={14} />
            <span>Back to home</span>
            <span className="kbd-shortcut">ESC</span>
          </button>
        </div>
      </header>
      <div className="auth-layout">
        <section className="auth-aside">
          <span className="eyebrow"><span className="live-dot" /> YOUR SPACE TO FIGURE IT OUT</span>
          <h1 className="text-4xl sm:text-5xl font-medium tracking-tight text-[var(--foreground)] my-3">
            Big goals.<br />
            <span>One small step.</span><br />
            You&apos;ve got this.
          </h1>
          <p className="text-[var(--muted)] text-xs leading-relaxed max-w-sm">
            A little structure, the right tools, and a space that makes learning feel like yours.
          </p>
        </section>

        <section className="auth-panel">
          <div className="max-w-sm mx-auto">
            <div className="mb-5">
              <span className="section-kicker">{isSignUp ? "A FRESH PAGE" : "GOOD TO HAVE YOU HERE"}</span>
              <h2 className="text-2xl font-semibold text-[var(--foreground)] mt-1">
                {isSignUp ? "Make it yours." : "Welcome back."}
              </h2>
              <p className="text-xs text-[#8c9194]">
                {isSignUp ? "Your study space is just a few details away." : "Pick up right where you left off."}
              </p>
            </div>

            {/* Standard Google OAuth Button */}
            <button
              type="button"
              className="google-button"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
            >
              <Icon name="google" size={18} />
              {isSubmitting ? "Connecting..." : "Continue with Google"}
            </button>

            <div className="flex items-center gap-2.5 my-4 text-[10px] text-[var(--muted)]">
              <span className="h-[1px] flex-1 bg-[rgba(255,255,255,0.08)]" />
              or with email
              <span className="h-[1px] flex-1 bg-[rgba(255,255,255,0.08)]" />
            </div>

            <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
              {isSignUp && (
                <label className="text-[10px] text-[var(--foreground)] flex flex-col gap-1.5">
                  Your name
                  <div className="input-wrap">
                    <span className="text-[var(--muted)]"><Icon name="spark" size={16} /></span>
                    <input type="text" name="name" placeholder="What should we call you?" autoComplete="name" required />
                  </div>
                </label>
              )}
              <label className="text-[10px] text-[var(--foreground)] flex flex-col gap-1.5">
                Email address
                <div className="input-wrap">
                  <span className="text-[var(--muted)]"><Icon name="mail" size={16} /></span>
                  <input type="email" name="email" placeholder="you@example.com" autoComplete="email" required />
                </div>
              </label>
              <label className="text-[10px] text-[var(--foreground)] flex flex-col gap-1.5">
                Password
                <div className="input-wrap">
                  <span className="text-[var(--muted)]"><Icon name="lock" size={16} /></span>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="At least 8 characters"
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                    minLength={8}
                    required
                  />
                  <button
                    className="text-[var(--muted)]"
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((s) => !s)}
                  >
                    <Icon name="eye" size={17} />
                  </button>
                </div>
              </label>

              {message && <p className="form-message" role="status">{message}</p>}

              <button className="button-primary w-full mt-2 justify-center" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Please wait..." : isSignUp ? "Create your free account" : "Get started"} <Icon name="arrow" size={15} />
              </button>
            </form>

            <p className="text-[10px] text-[var(--muted)] text-center mt-4">
              {isSignUp ? "Already have an account?" : "New to Synapse?"}{" "}
              <button
                type="button"
                className="text-[var(--lime)] font-semibold hover:underline cursor-pointer"
                onClick={() => { setIsSignUp(!isSignUp); setMessage(""); }}
              >
                {isSignUp ? "Sign in" : "Create a free account"}
              </button>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function LandingClient() {
  const router = useRouter();
  const [showAuth, setShowAuth] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const handleLoadingFinished = useCallback(() => {
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authError = params.get("authError");

    if (authError) {
      const timeout = window.setTimeout(() => {
        setAuthMessage(
          params.get("authMessage") ??
            (authError === "callback"
              ? "OAuth sign-in could not complete. Retry, then check the Supabase and Google redirect URL settings if it happens again."
              : `OAuth sign-in could not complete (${authError}). Check the Supabase and Google provider settings, then try again.`),
        );
        setShowAuth(true);
        window.history.replaceState(null, "", window.location.pathname + window.location.hash);
      }, 0);

      return () => window.clearTimeout(timeout);
    }
  }, []);

  return showAuth ? (
    <LoginPage
      onBack={() => {
        setShowAuth(false);
        setAuthMessage("");
        window.scrollTo({ top: 0, behavior: "instant" });
      }}
      initialMessage={authMessage}
    />
  ) : (
    <>
      {isLoading && <LoadingScreen onFinished={handleLoadingFinished} />}
      <LandingPage
        onGetStarted={() => {
          router.push("/login");
        }}
      />
    </>
  );
}
