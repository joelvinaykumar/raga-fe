import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

export type Theme = "light" | "dark" | "system";
type EffectiveTheme = "light" | "dark";

const STORAGE_KEY = "theme-preference"; // localStorage key

type ThemeContextValue = {
  theme: Theme;
  effectiveTheme: EffectiveTheme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void; // cycles light -> dark -> system -> light
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getSystemTheme(): EffectiveTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyThemeToDocument(effective: EffectiveTheme) {
  // For Tailwind class strategy (dark mode based on `class`):
  const html = document.documentElement;
  if (effective === "dark") {
    html.classList.add("dark");
  } else {
    html.classList.remove("dark");
  }

  // Optional: add data attribute for CSS/selectors or debugging
  html.setAttribute("data-theme", effective);
}

export const ThemeProvider = ({
  children,
  defaultTheme = "system",
}: {
  children: ReactNode;
  defaultTheme?: Theme;
}) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    // initial state: try reading localStorage synchronously only when available
    if (typeof window === "undefined") return defaultTheme;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return (raw as Theme) || defaultTheme;
    } catch {
      return defaultTheme;
    }
  });

  // derived effective theme
  const [effectiveTheme, setEffectiveTheme] = useState<EffectiveTheme>(() =>
    theme === "system" ? getSystemTheme() : (theme as EffectiveTheme),
  );

  // respond to system changes (when theme === 'system')
  useEffect(() => {
    if (theme !== "system") {
      setEffectiveTheme(theme as EffectiveTheme);
      applyThemeToDocument(theme as EffectiveTheme);
      return;
    }

    // theme === 'system' -> listen to media query
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      const newTheme = e.matches ? "dark" : "light";
      setEffectiveTheme(newTheme);
      applyThemeToDocument(newTheme);
    };

    // initial apply
    handler(mq);

    // event listener
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", handler as EventListener);
      return () => mq.removeEventListener("change", handler as EventListener);
    } else {
      // Safari fallback
      mq.addListener(handler as (e: MediaQueryListEvent) => void);
      return () =>
        mq.removeListener(handler as (e: MediaQueryListEvent) => void);
    }
  }, [theme]);

  // persist to localStorage whenever theme changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  // toggle function: cycle light -> dark -> system -> light
  const toggleTheme = () => {
    setThemeState((prev) => {
      const next =
        prev === "light" ? "dark" : prev === "dark" ? "system" : "light";
      return next;
    });
  };

  // wrapper setter that keeps state and syncs immediately
  const setTheme = (t: Theme) => {
    setThemeState(t);
  };

  // ensure document theme is applied at mount (handles SSR -> client hydration)
  useEffect(() => {
    const eff =
      theme === "system" ? getSystemTheme() : (theme as EffectiveTheme);
    setEffectiveTheme(eff);
    applyThemeToDocument(eff);
  }, []); // run once on mount

  const value: ThemeContextValue = {
    theme,
    effectiveTheme,
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
