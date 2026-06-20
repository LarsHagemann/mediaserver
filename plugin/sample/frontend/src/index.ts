import type { FrontendPlugin } from "@lars_hagemann/mediaserver-frontend-plugin-types";

const plugin: FrontendPlugin = {
  id: "sample-plugin",
  name: "Sample Plugin",
  description: "Demonstrates nav items, routes, and API access",

  navItems: [
    {
      id: "sample-page",
      path: "/sample",
      label: "Sample",
      icon: (icons) => icons.FaFlask,
      priority: 10,
    },
  ],

  routes: [
    {
      path: "/sample",
      Component: (context) => {
        const { React, api } = context;
        const [health, setHealth] = React.useState<string>("loading...");

        React.useEffect(() => {
          api
            .fetch("/health")
            .then((res) => res.json())
            .then((data) => setHealth(JSON.stringify(data)))
            .catch((err) => setHealth(`Error: ${err.message}`));
        }, [api]);

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
          React.createElement(
            "div",
            { className: "bg-surface-1 p-4 rounded-md" },
            React.createElement(
              "p",
              { className: "text-text-muted text-sm" },
              "Backend health: ",
            ),
            React.createElement(
              "code",
              { className: "text-text-primary" },
              health,
            ),
          ),
        );
      },
    },
  ],
};

export default plugin;
