import { useEffect, useRef, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "lv_theme";

// The page background each theme's fallback wipe paints, and when it flips/finishes.
const WIPE_BG: Record<Theme, string> = { light: "#f6f0e2", dark: "#15140f" };
const WIPE_FLIP_MS = 620;
const WIPE_DONE_MS = 1100;

function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : null;
}

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme() ?? getSystemTheme());
  const switching = useRef(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggle = (e?: { clientX: number; clientY: number }) => {
    if (switching.current) return;
    const next: Theme = theme === "dark" ? "light" : "dark";
    if (prefersReducedMotion()) {
      setTheme(next);
      return;
    }
    if (e) {
      document.documentElement.style.setProperty("--wx", `${e.clientX}px`);
      document.documentElement.style.setProperty("--wy", `${e.clientY}px`);
    }
    switching.current = true;
    if (document.startViewTransition) {
      document
        .startViewTransition(() => setTheme(next))
        .finished.finally(() => {
          switching.current = false;
        });
      return;
    }
    const wipe = document.createElement("div");
    wipe.className = "theme-wipe";
    wipe.setAttribute("aria-hidden", "true");
    wipe.style.background = WIPE_BG[next];
    document.body.append(wipe);
    window.setTimeout(() => {
      setTheme(next);
      wipe.classList.add("theme-wipe-out");
    }, WIPE_FLIP_MS);
    window.setTimeout(() => {
      wipe.remove();
      switching.current = false;
    }, WIPE_DONE_MS);
  };

  return { theme, toggle };
}
