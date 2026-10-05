"use client";

import { createContext, useContext, useEffect, useState } from "react";

export const ThemeContext = createContext({});

export function useTheme() {
  return useContext(ThemeContext);
}

const THEMES = {
  pink: {
    accent: "#ff4fa3",
    accentHover: "#ff2f91",
    bg: "#0b0b10",
    bgCard: "#12121a",
  },

  purple: {
    accent: "#a855f7",
    accentHover: "#9333ea",
    bg: "#0b0b10",
    bgCard: "#12121a",
  },

  blue: {
    accent: "#3b82f6",
    accentHover: "#2563eb",
    bg: "#0b0b10",
    bgCard: "#12121a",
  },

  green: {
    accent: "#22c55e",
    accentHover: "#16a34a",
    bg: "#0b0b10",
    bgCard: "#12121a",
  },
};

export default function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("pink");

  useEffect(() => {
    // Load from localStorage first
    const saved = localStorage.getItem("fa_theme") || "pink";

    setTheme(saved);
    applyTheme(saved);

    // Then sync from server
    fetch("/api/auth/preferences")
      .then((r) => r.json())
      .then((d) => {
        if (d.preferences?.theme && THEMES[d.preferences.theme]) {
          setTheme(d.preferences.theme);
          applyTheme(d.preferences.theme);
          localStorage.setItem("fa_theme", d.preferences.theme);
        }
      })
      .catch(() => {});
  }, []);

  function applyTheme(key) {
    const t = THEMES[key] || THEMES.pink;
    const root = document.documentElement;

    root.style.setProperty("--accent", t.accent);
    root.style.setProperty("--accent-hover", t.accentHover);
    root.style.setProperty("--bg", t.bg);
    root.style.setProperty("--bg-card", t.bgCard);
    root.style.setProperty("--accent-soft", t.accent + "28");
    root.style.setProperty("--accent-glow", t.accent + "44");
    root.style.setProperty("--border", t.accent + "18");
    root.style.setProperty("--border-md", t.accent + "30");
  }

  async function changeTheme(key) {
    if (!THEMES[key]) return;

    setTheme(key);
    applyTheme(key);
    localStorage.setItem("fa_theme", key);

    await fetch("/api/auth/preferences", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ theme: key }),
    }).catch(() => {});
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme: changeTheme,
        themes: THEMES,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}