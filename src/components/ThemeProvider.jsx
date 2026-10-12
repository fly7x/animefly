"use client";

import { createContext, useContext } from "react";

export const ThemeContext = createContext({});

export function useTheme() {
  return useContext(ThemeContext);
}

// Fly Anime uses a single fixed pink → orange gradient theme (set in
// globals.css via --accent / --accent-gradient). There is no runtime
// theme switcher anymore — this provider is now just a stable context
// so any component still calling useTheme() doesn't crash.
export default function ThemeProvider({ children }) {
  return (
    <ThemeContext.Provider value={{ theme: "gradient", themes: {} }}>
      {children}
    </ThemeContext.Provider>
  );
}
