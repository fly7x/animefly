"use client";
import { createContext, useContext } from "react";

export const ThemeContext = createContext({});
export function useTheme() { return useContext(ThemeContext); }

export default function ThemeProvider({ children }) {
  return (
    <ThemeContext.Provider value={{}}>
      {children}
    </ThemeContext.Provider>
  );
}

  useEffect(() => {
    // Load from localStorage first (instant)
    const saved = localStorage.getItem("fa_theme") || "pink";
    setTheme(saved);
    applyTheme(saved);

    // Then sync from server
    fetch("/api/auth/preferences")
      .then(r => r.json())
      .then(d => {
        if (d.preferences?.theme) {
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
    root.style.setProperty("--accent",       t.accent);
    root.style.setProperty("--accent-hover", t.accentHover);
    root.style.setProperty("--bg",           t.bg);
    root.style.setProperty("--bg-card",      t.bgCard);
    root.style.setProperty("--accent-soft",  t.accent + "28");
    root.style.setProperty("--accent-glow",  t.accent + "44");
    root.style.setProperty("--border",       t.accent + "18");
    root.style.setProperty("--border-md",    t.accent + "30");
  }

  async function changeTheme(key) {
    setTheme(key);
    applyTheme(key);
    localStorage.setItem("fa_theme", key);
    await fetch("/api/auth/preferences", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: key }),
    }).catch(() => {});
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme: changeTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}
