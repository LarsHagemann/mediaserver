import type { PluginApi } from "./plugin";

export function createPluginApi(): PluginApi {
  const baseUrl = import.meta.env.VITE_BACKEND_URL as string;

  return {
    baseUrl,
    fetch: (path: string, init?: RequestInit) =>
      fetch(`${baseUrl}${path}`, {
        ...init,
        credentials: "include",
      }),
  };
}

export const pluginApi = createPluginApi();
