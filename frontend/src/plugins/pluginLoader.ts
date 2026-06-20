import i18n from "i18next";
import z from "zod";
import { addFileTypePlugin } from "./addFileTypePlugin";
import { addThemePlugin } from "./addThemePlugin";
import { pluginRegistry } from "./pluginRegistry";
import type { FileTypePlugin, FrontendPlugin } from "./plugin";

const pluginManifestSchema = z.object({
  plugins: z.array(
    z.object({
      name: z.string(),
      url: z.string(),
    }),
  ),
  themePlugins: z
    .array(
      z.object({
        name: z.string(),
        url: z.string(),
      }),
    )
    .default([]),
  translations: z.array(
    z.object({
      name: z.string(),
      localName: z.string(),
      lang: z.string(),
      path: z.string(),
      flag: z.string(),
    }),
  ),
});

type Manifest = z.infer<typeof pluginManifestSchema>;

type PluginEntry = Manifest["plugins"][number];
type TranslationEntry = Manifest["translations"][number];

async function loadPluginManifest(
  manifestUrl = "/manifest.json",
): Promise<Manifest> {
  try {
    const response = await fetch(manifestUrl, { cache: "no-cache" });
    if (!response.ok) throw new Error("Failed to load plugin manifest");
    const manifest = await response.json();
    const parsed = pluginManifestSchema.parse(manifest);
    return parsed;
  } catch (error) {
    console.error("Error loading plugin manifest:", error);
    return {
      plugins: [],
      themePlugins: [],
      translations: [],
    };
  }
}

function isLegacyFileTypePlugin(obj: unknown): obj is FileTypePlugin {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "matcher" in obj &&
    typeof (obj as FileTypePlugin).matcher === "function"
  );
}

function isFrontendPlugin(obj: unknown): obj is FrontendPlugin {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "id" in obj &&
    typeof (obj as FrontendPlugin).id === "string"
  );
}

async function importPluginModule(url: string): Promise<{ default: unknown }> {
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(`Failed to fetch plugin: ${response.status}`);
  const code = await response.text();
  const blob = new Blob([code], { type: "application/javascript" });
  const blobUrl = URL.createObjectURL(blob);
  try {
    return await import(/* @vite-ignore */ blobUrl);
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

async function loadPlugin(plugin: PluginEntry) {
  try {
    const module = await importPluginModule(plugin.url);
    const exported = module.default;

    if (isFrontendPlugin(exported)) {
      pluginRegistry.register(exported);
      if (exported.fileType) {
        addFileTypePlugin(exported.fileType);
      }
      if (exported.theme) {
        addThemePlugin(exported.theme);
      }
    } else if (isLegacyFileTypePlugin(exported)) {
      addFileTypePlugin(exported);
      console.log(`Loaded legacy plugin: ${plugin.name}`);
    } else {
      console.warn(`Unknown plugin format: ${plugin.name}`);
    }
  } catch (error) {
    console.error(`Error loading plugin ${plugin.name}:`, error);
  }
}

async function loadThemePlugin(plugin: PluginEntry) {
  try {
    const module = await import(/* @vite-ignore */ plugin.url);
    addThemePlugin(module.default);
    console.log(`Loaded theme plugin: ${plugin.name}`);
  } catch (error) {
    console.error(`Error loading theme plugin ${plugin.name}:`, error);
  }
}

async function loadTranslation(translation: TranslationEntry) {
  const response = await fetch(translation.path);
  if (!response.ok) throw new Error("Failed to load translation plugin");
  const language = await response.json();
  const langCode = translation.name;
  i18n.addResourceBundle(langCode, "translation", language, true, true);
  i18n.addResourceBundle("languages", "translation", {
    ["languages." + langCode]: {
      name: translation.name,
      localName: translation.localName,
      flag: translation.flag,
    },
  });
  console.log(`Loaded translation plugin: ${translation.name}`);
}

export async function loadExternalPlugins(manifestUrl = "/manifest.json") {
  const manifest = await loadPluginManifest(manifestUrl);
  for (const plugin of manifest.plugins) {
    await loadPlugin(plugin);
  }
  for (const plugin of manifest.themePlugins) {
    await loadThemePlugin(plugin);
  }
  for (const lang of manifest.translations) {
    await loadTranslation(lang);
  }
}
