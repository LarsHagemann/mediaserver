import type { FrontendPlugin, NavItem, PluginRoute } from "./plugin";

const plugins: FrontendPlugin[] = [];

export const pluginRegistry = {
  register(plugin: FrontendPlugin): void {
    if (plugins.some((p) => p.id === plugin.id)) {
      console.warn(`Plugin with id "${plugin.id}" already registered`);
      return;
    }
    plugins.push(plugin);
    console.log(`Registered plugin: ${plugin.name}`);
  },

  getPlugins(): FrontendPlugin[] {
    return plugins;
  },

  getNavItems(): NavItem[] {
    return plugins
      .flatMap((p) => p.navItems ?? [])
      .sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));
  },

  getRoutes(): PluginRoute[] {
    return plugins.flatMap((p) => p.routes ?? []);
  },
};
