#!/usr/bin/env node
import * as readline from "readline";
import * as fs from "fs/promises";
import * as path from "path";
import { exec } from "child_process";

const frontendTsConfig = {
  compilerOptions: {
    target: "ES2023",
    lib: ["ES2023", "DOM"],
    module: "ESNext",
    skipLibCheck: true,

    /* Bundler mode */
    moduleResolution: "bundler",
    //"allowImportingTsExtensions": true,
    verbatimModuleSyntax: true,
    moduleDetection: "force",
    noEmit: false,
    outDir: "dist",

    /* Linting */
    strict: true,
    noUnusedLocals: true,
    noUnusedParameters: true,
    erasableSyntaxOnly: true,
    noFallthroughCasesInSwitch: true,
    noUncheckedSideEffectImports: true,
  },
  include: ["src/**/*.ts"],
};

const backendTsConfig = {
  compilerOptions: {
    target: "ES2023",
    lib: ["ES2023"],
    types: ["node"],
    module: "nodenext",
    skipLibCheck: true,
    outDir: "dist",
    moduleResolution: "nodenext",

    /* Linting */
    strict: true,
    noUnusedLocals: true,
    noUnusedParameters: true,
    erasableSyntaxOnly: true,
    noFallthroughCasesInSwitch: true,
    noUncheckedSideEffectImports: true,
  },
  include: ["src/**/*.ts"],
};

const backendDependencies = [
  "@types/node",
  "typescript",
  "@lars_hagemann/mediaserver-backend-plugin-types",
];

const frontendDependencies = [
  "typescript",
  "@types/react",
  "@types/react-dom",
  "@lars_hagemann/mediaserver-frontend-plugin-types",
];

const themeDependencies = [
  "typescript",
  "@lars_hagemann/mediaserver-frontend-plugin-types",
];

const themeTsConfig = {
  compilerOptions: {
    target: "ES2023",
    lib: ["ES2023", "DOM"],
    module: "ESNext",
    skipLibCheck: true,
    moduleResolution: "bundler",
    verbatimModuleSyntax: true,
    moduleDetection: "force",
    noEmit: false,
    outDir: "dist",
    strict: true,
    noUnusedLocals: true,
    noUnusedParameters: true,
    erasableSyntaxOnly: true,
    noFallthroughCasesInSwitch: true,
    noUncheckedSideEffectImports: true,
  },
  include: ["src/**/*.ts"],
};

const themeSkeleton = `
import type { ThemePlugin } from "@lars_hagemann/mediaserver-frontend-plugin-types";

const theme: ThemePlugin = {
  name: "my-theme",
  description: "My custom theme",
  tokens: {
    "--color-bg-base": "#0f172a",
    "--color-surface-1": "#1e293b",
    "--color-surface-2": "#334155",
    "--color-surface-3": "#475569",
    "--color-overlay": "rgb(0 0 0 / 0.7)",
    "--color-text-primary": "rgba(248, 250, 252, 0.9)",
    "--color-text-secondary": "#cbd5e1",
    "--color-text-muted": "#94a3b8",
    "--color-text-faint": "#64748b",
    "--color-accent": "#7c3aed",
    "--color-accent-hover": "#6d28d9",
    "--color-accent-subtle": "#a78bfa",
    "--color-accent-muted": "#c4b5fd",
    "--color-accent-dim": "rgb(109 40 217 / 0.4)",
    "--color-border": "#334155",
    "--color-border-subtle": "#475569",
    "--color-border-strong": "#64748b",
    "--color-chip-bg": "#334155",
    "--color-chip-text": "#cbd5e1",
    "--color-chip-hover": "#a78bfa",
    "--color-link": "#a78bfa",
    "--color-link-hover": "#c4b5fd",
  },
  preview: {
    accent: "#7c3aed",
    background: "#0f172a",
  },
};

export default theme;
`;

const backendSkeleton = `
import { FileTypePlugin } from "@lars_hagemann/mediaserver-backend-plugin-types";

export const plugin: FileTypePlugin = {
  matcher: (file) => /* Your implementation here */ false,
  thumbnailCreator: async (context) => {
    throw new Error("Not implemented");
  },
  initialTags: async (path) => {
    return [];
  },
  description: "Your plugin description here",
};

export default plugin;
`;

const frontendSkeleton = `
import type { FrontendPlugin } from "@lars_hagemann/mediaserver-frontend-plugin-types";

const plugin: FrontendPlugin = {
  id: "my-plugin",
  name: "My Plugin",
  description: "Your plugin description here",

  // Optional: Add navigation items to the sidebar
  // navItems: [
  //   {
  //     id: "my-page",
  //     path: "/my-plugin",
  //     label: "My Plugin",
  //     icon: (icons) => icons.FaPlug,
  //     priority: 10,
  //   },
  // ],

  // // Optional: Add custom routes
  // routes: [
  //   {
  //     path: "/my-plugin",
  //     Component: (context) => {
  //       const { React, api } = context;
  //
  //       return React.createElement(
  //         "div",
  //         { className: "p-6" },
  //         React.createElement(
  //           "h1",
  //           { className: "text-2xl font-bold text-text-primary mb-4" },
  //           "My Plugin Page",
  //         ),
  //         React.createElement(
  //           "p",
  //           { className: "text-text-secondary" },
  //           "This page is rendered by your plugin.",
  //         ),
  //       );
  //     },
  //   },
  // ],

  // Optional: Add a file type renderer
  // fileType: {
  //   matcher: (fileType) => false,
  //   icon: (icons) => icons.FaFile,
  //   Render: (context) => context.React.createElement("div", null, "Preview"),
  //   Diashow: () => null,
  //   description: "File type renderer",
  // },

  // Optional: Add a theme
  // theme: {
  //   name: "my-theme",
  //   description: "My custom theme",
  //   tokens: { "--color-accent": "#ff0000" },
  // },
};

export default plugin;
`;

const gitIgnoreContent = `
**/dist/
**/node_modules/
`;

const config = {
  frontend: {
    tsConfig: frontendTsConfig,
    dependencies: frontendDependencies,
    skeleton: frontendSkeleton,
  },
  backend: {
    tsConfig: backendTsConfig,
    dependencies: backendDependencies,
    skeleton: backendSkeleton,
  },
  theme: {
    tsConfig: themeTsConfig,
    dependencies: themeDependencies,
    skeleton: themeSkeleton,
  },
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => rl.question(query, resolve));
};

const questionOrDefault = async (
  query: string,
  defaultValue?: string
): Promise<string | undefined> => {
  const answer = await question(`${query} ${defaultValue ? `(${defaultValue})` : ""}: `);
  return answer.trim() === "" ? defaultValue : answer.trim();
};

const validateYesNo = (input: string | undefined, defaultValue?: boolean): boolean => {
  if (!input) return defaultValue || false;
  const trimmed = input.trim().toLowerCase();

  if (defaultValue) {
    return trimmed.length <= 3 && "yes".startsWith(trimmed);
  }

  return !("no".startsWith(trimmed) && trimmed.length <= 2);
};

const doExec = (command: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      if (stderr) {
        resolve(stderr)
        return;
      }
      resolve(stdout);
    });
  });
}

async function main() {
  const folderPath = await questionOrDefault(
    "Enter the plugin folder path",
    path.resolve(".")
  );
  const pluginName = await questionOrDefault(
    "Enter the plugin name",
    "my-plugin"
  );
  const authorName = await questionOrDefault(
    "Enter the author name",
    "Your Name"
  );
  const initGitString = await questionOrDefault("Initialize git? (Yes/no)");
  const initGit = validateYesNo(initGitString, true);

  console.log("\nPlugin Configuration:");
  console.log(`Folder Path: ${path.resolve(folderPath)}`);
  console.log(`Plugin Name: ${pluginName}`);
  console.log(`Author Name: ${authorName}`);
  console.log(`Initialize Git: ${initGit ? "Yes" : "No"}`);

  const validateString = await questionOrDefault("Create plugin? (Yes/no)");
  const validate = validateYesNo(validateString, true);

  rl.close();

  if (!validate) {
    console.log("Plugin creation cancelled.");
    return;
  }

  await fs.mkdir(folderPath + `/${pluginName}`, { recursive: true });
  const basePath = await fs.realpath(folderPath + `/${pluginName}`);

  for (const pluginType of ["frontend", "backend", "theme"] as const) {
    process.chdir(basePath);
    const path = basePath + `/${pluginType}`;

    await fs.mkdir(path, { recursive: true });
    await fs.mkdir(path + "/src", { recursive: true });

    const pluginFolderPath = await fs.realpath(path);
    const pluginSrcPath = `${pluginFolderPath}/src`;
    process.chdir(pluginFolderPath);

    const packageJsonContent = {
      name: `${pluginName}`,
      scripts: {
        build: "tsc",
      },
    };

    console.log("Writing package.json");
    await fs.writeFile(
      `${pluginFolderPath}/package.json`,
      JSON.stringify(packageJsonContent, null, 2)
    );

    const pluginConfig = config[pluginType];
    const tsConfigContent = pluginConfig.tsConfig;

    console.log("Writing tsconfig.json");
    await fs.writeFile(
      `${pluginFolderPath}/tsconfig.json`,
      JSON.stringify(tsConfigContent, null, 2)
    );

    console.log("Installing dependencies...");
    await doExec(`npm i -D ${pluginConfig.dependencies.join(" ")}`);

    console.log("Writing skeleton plugin file...");
    const pluginFileName = "index.ts";
    await fs.writeFile(
      `${pluginSrcPath}/${pluginFileName}`,
      pluginConfig.skeleton
    );
  }

  if (initGit) {
    console.log("Initializing git repository...");
    process.chdir(basePath);

    await fs.writeFile(
      `${basePath}/.gitignore`,
      gitIgnoreContent
    );

    await doExec("git init -b main");
    await doExec("git add .");
    await doExec('git commit -m "Initial commit"');
  }

  console.log("Plugin created successfully.");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
