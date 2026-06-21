import React from "react";
import type { PluginRoute } from "./plugin";
import { pluginApi } from "./pluginApi";
import { pluginComponents } from "./pluginComponents";
import { enhancedApi } from "../app/enhancedApi";
import { PluginErrorBoundary } from "../components/PluginErrorBoundary";

export function PluginRouteWrapper({ route }: { route: PluginRoute }) {
  const Component = route.Component;
  return (
    <PluginErrorBoundary pluginName={route.path}>
      <Component
        React={React}
        api={pluginApi}
        components={pluginComponents}
        dataApi={enhancedApi}
      />
    </PluginErrorBoundary>
  );
}
