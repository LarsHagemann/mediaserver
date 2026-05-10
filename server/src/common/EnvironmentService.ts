import type { FileServiceConfig } from "../files/FileService.js";
import type { DbServiceConfig } from "../sql/DbService.js";
import type { MigrationServiceConfig } from "../sql/MigrationService.js";
import {
  InvalidEnvironmentVariableError,
  MissingEnvironmentVariableError,
} from "./EnvironmentError.js";
import * as fs from "fs";

const validStages = ["development", "staging", "production"] as const;

export class EnvironmentService {
  private getStringEnvVar(key: string): string | undefined {
    // Direct value from environment variable
    // takes precedence over file-based value
    if (key in process.env) {
      return process.env[key];
    }

    const fileKey = `${key}_FILE`;
    if (fileKey in process.env) {
      try {
        const data = fs.readFileSync(process.env[fileKey]!, "utf-8");
        return data.trim();
      } catch (err) {
        throw new InvalidEnvironmentVariableError(
          fileKey,
          `Could not read file: ${(err as Error).message}`,
          "valid file path",
        );
      }
    }

    return undefined;
  }
  private getRequiredStringEnvVar(key: string): string {
    const value = this.getStringEnvVar(key);
    if (!value) {
      throw new MissingEnvironmentVariableError(key);
    }
    return value;
  }
  private getNumberEnvVar(key: string): number | undefined {
    const value = this.getStringEnvVar(key);
    if (!value) {
      return undefined;
    }
    const parsed = parseFloat(value);
    if (isNaN(parsed)) {
      throw new InvalidEnvironmentVariableError(key, value, "<float>");
    }

    return parsed;
  }
  private getRequiredNumberEnvVar(key: string): number {
    const value = this.getNumberEnvVar(key);
    if (value === undefined) {
      throw new MissingEnvironmentVariableError(key);
    }
    return value;
  }

  public get backendPort(): number {
    return this.getRequiredNumberEnvVar("BACKEND_PORT");
  }

  public get corsOrigin(): string {
    return this.getRequiredStringEnvVar("CORS_ORIGIN");
  }

  public get databaseConfig(): DbServiceConfig {
    return {
      host: this.getRequiredStringEnvVar("POSTGRES_HOST"),
      port: this.getRequiredNumberEnvVar("POSTGRES_PORT"),
      user: this.getRequiredStringEnvVar("POSTGRES_USER"),
      password: this.getRequiredStringEnvVar("POSTGRES_PASSWORD"),
      database: this.getRequiredStringEnvVar("POSTGRES_DB"),
    };
  }

  public get stage(): (typeof validStages)[number] {
    const stage = this.getRequiredStringEnvVar("STAGE");
    const validatedStage = validStages.find((s) => s === stage);
    if (!validatedStage) {
      throw new InvalidEnvironmentVariableError(
        "STAGE",
        stage,
        validStages.join(", "),
      );
    }
    return validatedStage;
  }

  public get migrationServiceConfig(): MigrationServiceConfig {
    return {
      migrationsDir: this.getRequiredStringEnvVar("MIGRATIONS_DIR"),
      ignoreChecksumMismatches:
        this.getStringEnvVar("IGNORE_MIGRATION_CHECKSUM_MISMATCHES") ===
        "true" && this.stage !== "production",
    };
  }

  public get fileUploadSizeLimit(): number {
    return this.getRequiredNumberEnvVar("MAX_FILE_UPLOAD_SIZE");
  }

  public get websocketPort(): number {
    return this.getRequiredNumberEnvVar("WEBSOCKET_PORT");
  }

  public get fileServiceConfig(): FileServiceConfig {
    return {
      defaultThumbnailPath: this.getRequiredStringEnvVar(
        "DEFAULT_THUMBNAIL_PATH",
      ),
      documentStoreConfigPath: this.getRequiredStringEnvVar(
        "DOCUMENT_STORE_CONFIG_PATH",
      ),
    };
  }

  public get redisHost(): string {
    return this.getRequiredStringEnvVar("REDIS_HOST");
  }

  public get redisPort(): number {
    return this.getRequiredNumberEnvVar("REDIS_PORT");
  }

  public get idpEnabled(): boolean {
    return this.getStringEnvVar("IDP_ENABLED") === "true";
  }

  public get idpRegistrationAllowed(): boolean {
    return this.getStringEnvVar("IDP_REGISTRATION_ALLOWED") === "true";
  }

  public get idpOidcDiscoveryUrl(): string {
    return this.getRequiredStringEnvVar("IDP_OIDC_DISCOVERY_URL");
  }

  public get idpClientId(): string {
    return this.getRequiredStringEnvVar("IDP_CLIENT_ID");
  }

  public get idpClientSecret(): string {
    return this.getRequiredStringEnvVar("IDP_CLIENT_SECRET");
  }

  public get idpRedirectUri(): string {
    return this.getRequiredStringEnvVar("IDP_REDIRECT_URI");
  }

  public get idpFrontendUrl(): string {
    return this.getRequiredStringEnvVar("IDP_FRONTEND_URL");
  }

  public get idpAdminUserIds(): string[] {
    const raw = this.getStringEnvVar("IDP_ADMIN_USER_IDS");
    if (!raw) return [];
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  }

  public get sessionTtlSeconds(): number {
    return this.getNumberEnvVar("SESSION_TTL_SECONDS") ?? 86400;
  }

  public get logLevel(): string {
    const level = this.getStringEnvVar("LOG_LEVEL") || "info";
    if (
      !["debug", "info", "warn", "error", "critical", undefined].includes(level)
    ) {
      throw new InvalidEnvironmentVariableError(
        "LOG_LEVEL",
        level,
        "debug, info, warn, error, critical",
      );
    }
    return level;
  }
}
