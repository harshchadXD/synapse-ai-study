"use client";

import { useSyncExternalStore, type ReactNode } from "react";

type Theme = "light" | "dark";

function getThemeSnapshot(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function getServerThemeSnapshot(): Theme {
  return "light";
}

function subscribeToTheme(callback: () => void) {
  function handleStorage(event: StorageEvent) {
    if (event.key !== "synapse-theme") return;
    document.documentElement.dataset.theme = event.newValue === "dark" ? "dark" : "light";
    callback();
  }

  window.addEventListener("synapse-theme-change", callback);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener("synapse-theme-change", callback);
    window.removeEventListener("storage", handleStorage);
  };
}

function toggleTheme(theme: Theme) {
  const nextTheme = theme === "light" ? "dark" : "light";
  document.documentElement.dataset.theme = nextTheme;
  localStorage.setItem("synapse-theme", nextTheme);
  window.dispatchEvent(new Event("synapse-theme-change"));
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  return children;
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerThemeSnapshot);
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="theme-toggle"
      role="switch"
      aria-checked={isDark}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      onClick={() => toggleTheme(theme)}
    >
      <span className="theme-toggle-icon" aria-hidden="true">
        {isDark ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.5 15.5A8.5 8.5 0 0 1 8.5 3.5 8.5 8.5 0 1 0 20.5 15.5Z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
          </svg>
        )}
      </span>
      <span className="theme-toggle-label">{isDark ? "Dark" : "Light"}</span>
      <span className="theme-toggle-track" aria-hidden="true">
        <span />
      </span>
    </button>
  );
}
