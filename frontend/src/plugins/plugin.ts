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
  components: PluginComponents;
};

export type DiashowContext = RenderContext & {
  nextDocument: () => void;
  preventAutoAdvance: () => void;
};

export type ThemeTokens = Record<string, string>;

export type ButtonVariant =
  | "primary"
  | "ghost"
  | "danger"
  | "outline"
  | "secondary";

export type IconSize =
  | "xsmall"
  | "small"
  | "medium"
  | "large"
  | "xlarge"
  | "xxlarge";

/**
 * The host-owned UI kit handed to plugins through every render context, so
 * plugins reuse the app's themed components instead of re-implementing them.
 * This is a deliberately small, stable surface: it is part of the published
 * plugin type package, so additions are cheap but changes/removals are
 * breaking. Render entries with `context.components`, e.g.
 * `React.createElement(components.Button, { variant: "primary" }, "Save")`.
 */
export type PluginComponents = {
  Button: React.FC<
    React.ButtonHTMLAttributes<HTMLButtonElement> & {
      variant?: ButtonVariant;
      children: React.ReactNode;
    }
  >;
  IconButton: React.FC<
    React.ButtonHTMLAttributes<HTMLButtonElement> & {
      children: React.ReactNode;
    }
  >;
  Badge: React.FC<{
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    onDelete?: () => void;
  }>;
  Modal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    className?: string;
  }>;
  ProgressBar: React.FC<{
    min?: number;
    max: number;
    value: number;
    color?: string;
  }>;
  Icon: React.FC<{
    Icon: IconType;
    size: IconSize;
    className?: string;
    title?: string;
  }>;
};

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
  components: PluginComponents;
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
  components: PluginComponents;
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
