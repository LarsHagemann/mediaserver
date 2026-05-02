import type { ThemePlugin } from "./plugin";

export const themePlugins: ThemePlugin[] = [];

export const addThemePlugin = (plugin: ThemePlugin) => {
  themePlugins.push(plugin);
};
