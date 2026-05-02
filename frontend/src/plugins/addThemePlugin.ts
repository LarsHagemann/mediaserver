import type { ThemePlugin } from "../../../plugin/frontend-types/types/plugin";

export const themePlugins: ThemePlugin[] = [];

export const addThemePlugin = (plugin: ThemePlugin) => {
  themePlugins.push(plugin);
};
