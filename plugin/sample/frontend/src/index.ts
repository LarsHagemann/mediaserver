import type { FrontendPlugin } from "@lars_hagemann/mediaserver-frontend-plugin-types";
import { scorePanel } from "./scorePanel.js";
import { samplePage } from "./samplePage.js";

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

  documentInfo: scorePanel,

  routes: [samplePage],
};

export default plugin;
