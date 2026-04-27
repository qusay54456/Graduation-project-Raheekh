import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { getTranslation, SUPPORTED_LANGS, type Lang, type TranslationKey } from "@/lib/translations";

const STORAGE_KEY = "parknow.lang";

interface I18nContextValue {
  lang: Lang;
  dir: "rtl" | "ltr";
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  t: (key: TranslationKey | string) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function readInitialLang(): Lang {
  if (typeof window === "undefined") return "ar";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && (SUPPORTED_LANGS as string[]).includes(stored)) return stored as Lang;
  } catch {
    // localStorage may be unavailable in some embed contexts; safe to ignore.
  }
  return "ar";
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => readInitialLang());

  const dir: "rtl" | "ltr" = lang === "ar" ? "rtl" : "ltr";

  // Sync the document root's `dir` and `lang` attributes so global CSS / browser
  // accessibility tooling pick up the change. Persist to localStorage.
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.dir = dir;
      document.documentElement.lang = lang;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore storage failures
    }
  }, [lang, dir]);

  const setLang = useCallback((next: Lang) => setLangState(next), []);
  const toggleLang = useCallback(() => setLangState((prev) => (prev === "ar" ? "en" : "ar")), []);

  const t = useCallback((key: string) => getTranslation(lang, key), [lang]);

  const value = useMemo(() => ({ lang, dir, setLang, toggleLang, t }), [lang, dir, setLang, toggleLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useTranslation must be used inside <I18nProvider>");
  return ctx;
}
