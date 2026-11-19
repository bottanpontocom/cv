/**
 * script.ts: language (en / pt-BR) and theme (light / dark) switching.
 *
 * Compile with:  tsc assets/js/script.ts --target ES2020 --strict
 *
 * Content is bilingual in the markup (see the lang attributes in index.html);
 * this file only decides which language is active, and keeps <html lang>,
 * <html data-theme>, the document title and the button labels in sync.
 *
 * It is loaded as a blocking script in <head>, so render() runs once before
 * the first paint (no flash of the wrong theme), then again when the buttons
 * exist in the DOM.
 */

type Lang = "en" | "pt-BR";
type Theme = "light" | "dark";

const LANGS: readonly Lang[] = ["en", "pt-BR"];
const THEMES: readonly Theme[] = ["light", "dark"];

const STORAGE_KEYS = {
  lang: "resume:lang",
  theme: "resume:theme",
} as const;

/** Matches --paper and --black in ../css/style.css; used for the browser UI colour. */
const THEME_COLORS: Record<Theme, string> = {
  light: "#FFF8E2",
  dark: "#2C2C2C",
};

interface UiStrings {
  /** Update with your name. */
  documentTitle: string;
  /** Short code shown next to the globe icon. */
  langCode: string;
  /** Accessible name of the language button: describes what a click does. */
  switchLang: string;
  /** Accessible name of the theme button, keyed by the CURRENT theme. */
  switchTheme: Record<Theme, string>;
}

const UI: Record<Lang, UiStrings> = {
  en: {
    documentTitle: "Your Name – Résumé",
    langCode: "EN",
    switchLang: "Mudar para português",
    switchTheme: {
      light: "Switch to dark theme",
      dark: "Switch to light theme",
    },
  },
  "pt-BR": {
    documentTitle: "Seu Nome – Currículo",
    langCode: "PT",
    switchLang: "Switch to English",
    switchTheme: {
      light: "Mudar para o tema escuro",
      dark: "Mudar para o tema claro",
    },
  },
};

/* Storage (can throw in private mode or when blocked, so always guarded) */

function load<T extends string>(key: string, allowed: readonly T[]): T | null {
  try {
    const value = localStorage.getItem(key);
    return allowed.find((item) => item === value) ?? null;
  } catch {
    return null;
  }
}

function save(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* preference simply won't persist */
  }
}

/* State: saved choice first, then the visitor's browser settings */

const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");

function detectLang(): Lang {
  return navigator.language.toLowerCase().startsWith("pt") ? "pt-BR" : "en";
}

let lang: Lang = load(STORAGE_KEYS.lang, LANGS) ?? detectLang();
let theme: Theme =
  load(STORAGE_KEYS.theme, THEMES) ?? (prefersDark.matches ? "dark" : "light");

/* Rendering */

function render(): void {
  const root = document.documentElement;
  const strings = UI[lang];

  root.lang = lang;
  root.dataset.theme = theme;
  document.title = strings.documentTitle;
  document
    .querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    ?.setAttribute("content", THEME_COLORS[theme]);

  const langButton = document.querySelector<HTMLButtonElement>("#lang-toggle");
  const langCode = document.querySelector<HTMLElement>("#lang-code");
  const themeButton = document.querySelector<HTMLButtonElement>("#theme-toggle");

  if (langButton) {
    langButton.setAttribute("aria-label", strings.switchLang);
    langButton.title = strings.switchLang;
  }
  if (langCode) {
    langCode.textContent = strings.langCode;
  }
  if (themeButton) {
    const label = strings.switchTheme[theme];
    themeButton.setAttribute("aria-label", label);
    themeButton.title = label;
  }
}

function toggleLang(): void {
  lang = lang === "en" ? "pt-BR" : "en";
  save(STORAGE_KEYS.lang, lang);
  render();
}

function toggleTheme(): void {
  theme = theme === "light" ? "dark" : "light";
  save(STORAGE_KEYS.theme, theme);
  render();
}

/* Boot */

render(); // before first paint: sets lang and theme on <html>

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#lang-toggle")?.addEventListener("click", toggleLang);
  document.querySelector("#theme-toggle")?.addEventListener("click", toggleTheme);
  render(); // buttons exist now: sync their labels
});

// Follow the system theme until the visitor makes a choice of their own.
prefersDark.addEventListener("change", (event) => {
  if (load(STORAGE_KEYS.theme, THEMES) === null) {
    theme = event.matches ? "dark" : "light";
    render();
  }
});
