import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Icon } from "../components/Icon";
import { IconButton } from "../components/IconButton";
import { Modal } from "../components/Modal";
import { ProgressBar } from "../components/ProgressBar";
import type { PluginComponents } from "./plugin";

/**
 * The host-owned UI kit handed to plugins through their render context
 * (`context.components`), mirroring how the host's React singleton is injected.
 * Keep this surface small and intentional: every entry becomes part of the
 * public plugin type package, so adding is cheap but changing or removing an
 * entry is a breaking release. Type drift between a component and its declared
 * shape in `plugin.ts` surfaces here as a compile error.
 */
export const pluginComponents: PluginComponents = {
  Button,
  IconButton,
  Badge,
  Modal,
  ProgressBar,
  Icon,
};
