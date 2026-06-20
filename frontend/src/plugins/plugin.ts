import type { IconType } from "react-icons";
import * as fa from "react-icons/fa";
import * as md from "react-icons/md";
import * as gi from "react-icons/gi";
import React from "react";

export const reactIcons = {
  ...fa,
  ...md,
  ...gi,
};

export type ReactIcons = typeof reactIcons;

export type RenderContext = {
  objectUrl: string;
  React: typeof React;
};

export type DiashowContext = RenderContext & {
  nextDocument: () => void;
  preventAutoAdvance: () => void;
};

export type ThemeTokens = Record<string, string>;

export type FileTypePlugin = {
  matcher: (fileType: string) => boolean;
  icon: (ReactIcons: ReactIcons) => IconType;
  Render: React.FC<RenderContext>;
  Diashow: React.FC<DiashowContext>;
  description: string;
  fetchMode?: "download" | "stream";
  theme?: ThemeTokens;
};

export type ThemePlugin = {
  name: string;
  description: string;
  tokens: ThemeTokens;
  preview?: {
    accent: string;
    background: string;
  };
};

export type PluginApi = {
  baseUrl: string;
  fetch: (path: string, init?: RequestInit) => Promise<Response>;
};

export type RouteContext = {
  React: typeof React;
  api: PluginApi;
};

/**
 * The subset of a document that is exposed to plugins rendering into the
 * document info panel. Plugins use `id` to read/write per-document tags via
 * `api.fetch` (e.g. `GET /tags/:id`, `POST /tags/:id/add`).
 */
export type DocumentInfo = {
  id: string;
  mime: string;
  friendlyName: string;
  ownerId: string;
  isPublic: boolean;
};

export type DocumentInfoContext = {
  React: typeof React;
  api: PluginApi;
  document: DocumentInfo;
};

/**
 * Contributes a section to the document info panel. `matcher` decides which
 * documents the section applies to (by MIME type); `Render` draws the section
 * and may persist editable values as tags through `context.api`.
 */
export type DocumentInfoPlugin = {
  matcher: (fileType: string) => boolean;
  Render: React.FC<DocumentInfoContext>;
};

export type NavItem = {
  id: string;
  path: string;
  label: string;
  icon: (icons: ReactIcons) => IconType;
  permission?: string;
  priority?: number;
};

export type PluginRoute = {
  path: string;
  Component: React.FC<RouteContext>;
};

export type FrontendPlugin = {
  id: string;
  name: string;
  description?: string;
  fileType?: FileTypePlugin;
  theme?: ThemePlugin;
  navItems?: NavItem[];
  routes?: PluginRoute[];
  documentInfo?: DocumentInfoPlugin;
};
