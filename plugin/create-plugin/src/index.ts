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
import type { FileTypePlugin } from "@lars_hagemann/mediaserver-frontend-plugin-types";

const plugin: FileTypePlugin = {
  matcher: (fileType) => /* Your implementation here */ false,
  icon: (ReactIcons) => /* Your implementation here */ ReactIcons.FaFile,
  Render: (context) => {
    context.React.useEffect(() => {
      console.log("This worked!");
    }, []);

    return context.React.createElement("iframe", {
      className: "w-full h-full",
      src: context.objectUrl,
    });
  },
  Diashow: () => null,
  description: "Your plugin description here",
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

  for (const pluginType of ["frontend", "backend"] as const) {
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
