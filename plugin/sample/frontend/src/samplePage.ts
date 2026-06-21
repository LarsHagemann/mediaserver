import type { PluginRoute } from "@lars_hagemann/mediaserver-frontend-plugin-types";

// The route lives in its own file and is imported by `index.ts`. esbuild
// inlines it into the single bundle that the host loads.
export const samplePage: PluginRoute = {
  path: "/sample",
  Component: (context) => {
    const { React, api, components } = context;
    const [health, setHealth] = React.useState<string>("loading...");

    const loadHealth = React.useCallback(() => {
      setHealth("loading...");
      api
        .fetch("/health")
        .then((res) => res.json())
        .then((data) => setHealth(JSON.stringify(data)))
        .catch((err) => setHealth(`Error: ${err.message}`));
    }, [api]);

    React.useEffect(() => {
      loadHealth();
    }, [loadHealth]);

    return React.createElement(
      "div",
      { className: "p-6" },
      React.createElement(
        "h1",
        { className: "text-2xl font-bold text-text-primary mb-4" },
        "Sample Plugin Page",
      ),
      React.createElement(
        "p",
        { className: "text-text-secondary mb-2" },
        "This page is rendered by a plugin.",
      ),
      // Reuse the host's themed Button instead of styling our own.
      React.createElement(components.Button, {
        variant: "secondary",
        onClick: loadHealth,
        className: "mb-4",
        children: "Refresh health",
      }),
      React.createElement(
        "div",
        { className: "bg-surface-1 p-4 rounded-md" },
        React.createElement(
          "p",
          { className: "text-text-muted text-sm" },
          "Backend health: ",
        ),
        React.createElement("code", { className: "text-text-primary" }, health),
      ),
    );
  },
};
