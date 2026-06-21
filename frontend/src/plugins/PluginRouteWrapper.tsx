import React from "react";
import type { PluginRoute } from "./plugin";
import { pluginApi } from "./pluginApi";
import { pluginComponents } from "./pluginComponents";

export function PluginRouteWrapper({ route }: { route: PluginRoute }) {
  const Component = route.Component;
  return (
    <Component React={React} api={pluginApi} components={pluginComponents} />
  );
}
