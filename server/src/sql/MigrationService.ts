import z from "zod";
import type { EnvironmentService } from "../common/EnvironmentService.js";
import type { DbService } from "./DbService.js";
import path from "path";
import fs from "fs/promises";
import { createHash } from "crypto";
import type { LoggingService } from "../common/LoggingService.js";
import { MissingMigrationError } from "./errors/MissingMigrationError.js";
import { MigrationOrderMismatchError } from "./errors/MigrationOrderMismatchError.js";
import { MigrationChecksumError } from "./errors/MigrationChecksumError.js";

export type MigrationServiceConfig = {
  migrationsDir: string;
  ignoreChecksumMismatches: boolean;
};

type Migration = {
  name: string;
  checksum: string;
};

const existsSchema = z.object({
  exists: z.boolean(),
});

const migrationRowSchema = z.object({
  name: z.string().max(255),
  checksum: z.string().length(64),
  created_at: z.date(),
});

export class MigrationService {
  constructor(
    private readonly envService: EnvironmentService,
    private readonly dbService: DbService,
    private readonly logger: LoggingService,
  ) {}

  private async checkMigrationsTableExists() {
    const result = await this.dbService.one(
      existsSchema,
      `
      SELECT EXISTS (
        SELECT FROM 
            pg_tables
        WHERE 
            schemaname = 'public' AND 
            tablename  = 'migrations'
        );
    `,
    );

    return result.exists;
  }

  private async setupMigrationsTable() {
    if (!(await this.checkMigrationsTableExists())) {
      await this.dbService.none(`
        CREATE TABLE migrations (
          name VARCHAR(255) NOT NULL PRIMARY KEY,
          checksum VARCHAR(64) NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);
    }
  }

  private async calculateFileChecksum(filePath: string): Promise<string> {
    const fileBuffer = await fs.readFile(filePath);
    const hash = createHash("sha256");
    hash.update(fileBuffer);
    return hash.digest("hex");
  }

  private async listMigrationFiles(): Promise<Migration[]> {
    const { migrationsDir } = this.envService.migrationServiceConfig;
    const migrationFiles = await fs.readdir(migrationsDir);

    const allMigrations = await Promise.all(
      migrationFiles
        .filter((file) => file.endsWith(".sql"))
        .map(async (file) => {
          const filePath = path.join(migrationsDir, file);
          const checksum = await this.calculateFileChecksum(filePath);
          return { name: file, checksum };
        }),
    );

    // Early migrations are of the form <migration-name>.sql whilst later
    // migrations are prefixed with a timestamp <YYYY-MM-DD>-<Counter>-<migration-name>.sql
    // Both forms sort correctly lexicographically, but we need to move all the
    // earlier migrations to the start of the list.
    allMigrations.sort((a, b) => {
      const aIsEarly = /^\d{4}-\d{2}-\d{2}-\d+-/.test(a.name) === false;
      const bIsEarly = /^\d{4}-\d{2}-\d{2}-\d+-/.test(b.name) === false;

      if (aIsEarly && !bIsEarly) {
        return -1;
      } else if (!aIsEarly && bIsEarly) {
        return 1;
      } else {
        return a.name.localeCompare(b.name);
      }
    });

    console.log(allMigrations);
    return allMigrations;
  }

  private async validateExistingMigrations(): Promise<Migration[]> {
    const existingMigrations = await this.dbService.any(
      migrationRowSchema,
      `
      SELECT name, checksum, created_at
      FROM migrations
      ORDER BY created_at ASC
      `,
    );
    const migrationFiles = await this.listMigrationFiles();

    const migrationsToBeReapplied: Migration[] = [];

    for (const migration of existingMigrations) {
      this.logger.debug(`Validating migration ${migration.name}`);
      const migrationFileIndex = migrationFiles.findIndex(
        (m) => m.name === `${migration.name}.sql`,
      );
      const migrationFile = migrationFiles[migrationFileIndex];

      if (!migrationFile) {
        throw new MissingMigrationError(migration.name);
      }
      if (migrationFileIndex !== 0) {
        throw new MigrationOrderMismatchError(
          migration.name,
          migrationFiles[migrationFileIndex]!.name,
        );
      }

      const { ignoreChecksumMismatches } =
        this.envService.migrationServiceConfig;
      if (migrationFile.checksum !== migration.checksum) {
        if (ignoreChecksumMismatches) {
          this.logger.warn(
            `| Ignoring checksum mismatch for migration ${migrationFile.name}`,
          );
          migrationsToBeReapplied.push({
            checksum: migrationFile.checksum,
            name: migrationFile.name,
          });
        } else {
          throw new MigrationChecksumError(migrationFile.name);
        }
      }

      this.logger.debug(`\\ Migration ${migration.name} is valid`);

      migrationFiles.splice(0, 1);
    }

    const resultMigrations = migrationFiles.concat(
      migrationsToBeReapplied.reverse(),
    );
    this.logger.debug(`Found ${resultMigrations.length} new migrations`);
    return resultMigrations;
  }

  private async applyMigration(migration: Migration) {
    this.logger.info(`- Applying migration ${migration.name}`);

    const migrationPath = path.join(
      this.envService.migrationServiceConfig.migrationsDir,
      migration.name,
    );
    const migrationSQL = await fs.readFile(migrationPath, "utf-8");
    await this.dbService.none(migrationSQL);

    await this.dbService.none(
      `
      INSERT INTO migrations (name, checksum, created_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (name) DO UPDATE SET checksum = EXCLUDED.checksum
      `,
      [path.basename(migrationPath, ".sql"), migration.checksum],
    );

    this.logger.info(`  - Migration ${migration.name} applied successfully`);
  }

  private async applyMissingMigrations(missingMigrations: Migration[]) {
    for (const migration of missingMigrations) {
      await this.applyMigration(migration);
    }
  }

  public async migrate() {
    this.logger.info(`Starting migration process`);
    await this.setupMigrationsTable();
    const missingMigrations = await this.validateExistingMigrations();
    await this.applyMissingMigrations(missingMigrations);
    this.logger.info(`Migration process completed`);
  }
}
