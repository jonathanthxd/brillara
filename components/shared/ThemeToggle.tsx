"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "brillara-theme";
const THEME_EVENT = "brillara:theme-changed";

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener(THEME_EVENT, onStoreChange);
      return () => window.removeEventListener(THEME_EVENT, onStoreChange);
    },
    () => window.localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light",
    () => "light",
  );

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function toggleTheme() {
    const nextTheme: Theme = theme === "light" ? "dark" : "light";
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-card/80 text-muted-foreground transition-all hover:border-primary/40 hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      aria-label={theme === "light" ? "Activar modo oscuro" : "Activar modo claro"}
      title={theme === "light" ? "Modo oscuro" : "Modo claro"}
    >
      {theme === "dark" ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
    </button>
  );
}
