/**
 * script.js: language (en / pt-BR) and theme (light / dark) switching.
 *
 * Content is bilingual in the markup (see the lang attributes in index.html);
 * this file only decides which language is active, and keeps <html lang>,
 * <html data-theme>, the document title and the button labels in sync.
 *
 * It is loaded as a blocking script in <head>, so render() runs once before
 * the first paint (no flash of the wrong theme), then again when the buttons
 * exist in the DOM.
 */

(function () {
  "use strict";

  var LANGS = ["en", "pt-BR"];
  var THEMES = ["light", "dark"];

  var STORAGE_KEYS = {
    lang: "resume:lang",
    theme: "resume:theme",
  };

  /** Matches --paper and --black in ../css/style.css; used for the browser UI colour. */
  var THEME_COLORS = {
    light: "#FFF8E2",
    dark: "#2C2C2C",
  };

  /**
   * Interface strings.
   *   documentTitle  update with your name
   *   langCode       short code shown next to the globe icon
   *   switchLang     accessible name of the language button (what a click does)
   *   switchTheme    accessible name of the theme button, keyed by CURRENT theme
   */
  var UI = {
    en: {
      documentTitle: "Diego Bottan – CV",
      langCode: "EN",
      switchLang: "Mudar para português",
      switchTheme: {
        light: "Switch to dark theme",
        dark: "Switch to light theme",
      },
    },
    "pt-BR": {
      documentTitle: "Diego Bottan – CV",
      langCode: "PT",
      switchLang: "Switch to English",
      switchTheme: {
        light: "Mudar para o tema escuro",
        dark: "Mudar para o tema claro",
      },
    },
  };

  /* Storage (can throw in private mode or when blocked, so always guarded) */

  function load(key, allowed) {
    try {
      var value = localStorage.getItem(key);
      return allowed.indexOf(value) !== -1 ? value : null;
    } catch (error) {
      return null;
    }
  }

  function save(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      /* preference simply won't persist */
    }
  }

  /* State: saved choice first, then the visitor's browser settings */

  var prefersDark = window.matchMedia("(prefers-color-scheme: dark)");

  function detectLang() {
    return navigator.language.toLowerCase().indexOf("pt") === 0 ? "pt-BR" : "en";
  }

  var lang = load(STORAGE_KEYS.lang, LANGS) || detectLang();
  var theme = load(STORAGE_KEYS.theme, THEMES) || (prefersDark.matches ? "dark" : "light");

  /* Rendering */

  function render() {
    var root = document.documentElement;
    var strings = UI[lang];

    root.lang = lang;
    root.dataset.theme = theme;
    document.title = strings.documentTitle;

    var themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) {
      themeColor.setAttribute("content", THEME_COLORS[theme]);
    }

    var langButton = document.querySelector("#lang-toggle");
    var langCode = document.querySelector("#lang-code");
    var themeButton = document.querySelector("#theme-toggle");

    if (langButton) {
      langButton.setAttribute("aria-label", strings.switchLang);
      langButton.title = strings.switchLang;
    }
    if (langCode) {
      langCode.textContent = strings.langCode;
    }
    if (themeButton) {
      var label = strings.switchTheme[theme];
      themeButton.setAttribute("aria-label", label);
      themeButton.title = label;
    }
  }

  function toggleLang() {
    lang = lang === "en" ? "pt-BR" : "en";
    save(STORAGE_KEYS.lang, lang);
    render();
  }

  function toggleTheme() {
    theme = theme === "light" ? "dark" : "light";
    save(STORAGE_KEYS.theme, theme);
    render();
  }

  /* Boot */

  render(); // before first paint: sets lang and theme on <html>

  document.addEventListener("DOMContentLoaded", function () {
    var langButton = document.querySelector("#lang-toggle");
    var themeButton = document.querySelector("#theme-toggle");

    if (langButton) langButton.addEventListener("click", toggleLang);
    if (themeButton) themeButton.addEventListener("click", toggleTheme);

    render(); // buttons exist now: sync their labels
  });

  // Follow the system theme until the visitor makes a choice of their own.
  prefersDark.addEventListener("change", function (event) {
    if (load(STORAGE_KEYS.theme, THEMES) === null) {
      theme = event.matches ? "dark" : "light";
      render();
    }
  });
})();
