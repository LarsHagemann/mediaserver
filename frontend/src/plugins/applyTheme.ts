import type { ThemePlugin } from "../../../plugin/frontend-types/types/plugin";

const THEME_STORAGE_KEY = "activeTheme";

let appliedTokenKeys: string[] = [];

export const applyTheme = (plugin: ThemePlugin | null) => {
  const root = document.documentElement;

  appliedTokenKeys.forEach((key) => root.style.removeProperty(key));
  appliedTokenKeys = [];

  if (!plugin) {
    localStorage.removeItem(THEME_STORAGE_KEY);
    return;
  }

  Object.entries(plugin.tokens).forEach(([key, value]) => {
    root.style.setProperty(key, value);
    appliedTokenKeys.push(key);
  });

  localStorage.setItem(THEME_STORAGE_KEY, plugin.name);
};

export const getPersistedThemeName = (): string | null => {
  return localStorage.getItem(THEME_STORAGE_KEY);
};
