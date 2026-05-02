import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { readFile, readdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { DbService } from "../../sql/DbService.js";
import type { LoggingService } from "../../common/LoggingService.js";
import type { EnvironmentService } from "../../common/EnvironmentService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(__dirname, "../../../assets/db/migrations");

const noopLogger: LoggingService = {
  info: () => { },
  error: () => { },
  warn: () => { },
  debug: () => { },
} as unknown as LoggingService;

const dummyEnvService = {
  databaseConfig: { host: "", port: 0, user: "", password: "", database: "" },
} as unknown as EnvironmentService;

export async function createTestDb(): Promise<{
  container: StartedPostgreSqlContainer;
  dbService: DbService;
  teardown: () => Promise<void>;
}> {
  const container = await new PostgreSqlContainer("postgres:16-alpine").start();

  const dbService = new DbService(dummyEnvService, noopLogger, {
    host: container.getHost(),
    port: container.getPort(),
    user: container.getUsername(),
    password: container.getPassword(),
    database: container.getDatabase(),
  });

  await dbService.connect();
  await runMigrations(dbService);

  return {
    container,
    dbService,
    teardown: async () => {
      await dbService.disconnect();
      await container.stop();
    },
  };
}

async function runMigrations(dbService: DbService): Promise<void> {
  const allFiles = (await readdir(migrationsDir)).filter((f) => f.endsWith(".sql"));

  // Undated files (e.g. document-table.sql) run first, then dated files (YYYY-MM-DD-...) in order
  allFiles.sort((a, b) => {
    const aIsDated = /^\d{4}-\d{2}-\d{2}-\d+-/.test(a);
    const bIsDated = /^\d{4}-\d{2}-\d{2}-\d+-/.test(b);
    if (!aIsDated && bIsDated) return -1;
    if (aIsDated && !bIsDated) return 1;
    return a.localeCompare(b);
  });

  for (const file of allFiles) {
    const sql = await readFile(path.join(migrationsDir, file), "utf-8");
    // Run each statement separately
    for (const stmt of sql.split(";").map((s) => s.trim()).filter(Boolean)) {
      await dbService.none(stmt);
    }
  }
}
