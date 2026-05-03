import { Client, type ClientConfig, type QueryConfig } from "pg";
import type { EnvironmentService } from "../common/EnvironmentService.js";
import z from "zod";
import { withErrorHandler } from "../common/withErrorHandler.js";
import type { LoggingService } from "../common/LoggingService.js";
import { NotConnectedError } from "./errors/NotConnectedError.js";
import { TooManyConnectionsError } from "./errors/TooManyConnectionsError.js";
import { InvalidRowNumberError } from "./errors/InvalidRowNumberError.js";
import { RowSchemaMismatchError } from "./errors/RowSchemaMismatchError.js";

export type DbServiceConfig = ClientConfig;

type ZodSchemaType = z.ZodObject | z.ZodIntersection;

abstract class DbTask {
  abstract one<ResultSchema extends ZodSchemaType>(
    schema: ResultSchema,
    queryTextOrConfig: string | QueryConfig<unknown[]>,
    values?: unknown[] | Record<string, unknown>,
  ): Promise<z.infer<ResultSchema>>;

  abstract many<ResultSchema extends ZodSchemaType>(
    schema: ResultSchema,
    queryTextOrConfig: string | QueryConfig<unknown[]>,
    values?: unknown[] | Record<string, unknown>,
  ): Promise<z.infer<ResultSchema>[]>;

  abstract any<ResultSchema extends ZodSchemaType>(
    schema: ResultSchema,
    queryTextOrConfig: string | QueryConfig<unknown[]>,
    values?: unknown[] | Record<string, unknown>,
  ): Promise<z.infer<ResultSchema>[]>;
  abstract oneOrNone<ResultSchema extends ZodSchemaType>(
    schema: ResultSchema,
    queryTextOrConfig: string | QueryConfig<unknown[]>,
    values?: unknown[] | Record<string, unknown>,
  ): Promise<z.infer<ResultSchema> | null>;

  abstract none(
    queryTextOrConfig: string | QueryConfig<unknown[]>,
    values?: unknown[] | Record<string, unknown>,
  ): Promise<void>;

  abstract transaction(onTransaction: () => Promise<void>): Promise<void>;
}

const escapeValues = (
  queryTextOrConfig: string | QueryConfig<unknown[]>,
  values?: unknown[] | Record<string, unknown>,
): [string | QueryConfig<unknown[]>, unknown[] | undefined] => {
  if (values === undefined) {
    return [queryTextOrConfig, undefined];
  }

  if (Array.isArray(values)) {
    return [queryTextOrConfig, values];
  }

  const toPlaceholder = Object.fromEntries(
    Object.keys(values).map((key, index) => [key, `$${index + 1}`]),
  );

  // parse $keyInValuesObject and $otherKeyInValuesObject into
  // $1, $2, etc...
  const query =
    typeof queryTextOrConfig === "string"
      ? queryTextOrConfig.replace(/\$(\w+)/g, (match, key) => {
        if (!(key in toPlaceholder)) {
          console.error(`Key ${key} not found in values object for query placeholder`, values);
          throw new Error(
            `Key ${key} not found in values object for query placeholder`,
          );
        }
        return toPlaceholder[key] || match;
      })
      : queryTextOrConfig;

  return [query, Object.values(values)];
};

export class DbService implements DbTask {
  private readonly config: DbServiceConfig;
  private client_: Client | undefined;

  constructor(
    envService: EnvironmentService,
    private readonly logger: LoggingService,
    private readonly configOverride?: DbServiceConfig,
  ) {
    this.config = {
      ...envService.databaseConfig,
      ...(this.configOverride || {}),
    };
  }

  private get client(): Client {
    if (!this.client_) {
      throw new NotConnectedError();
    }
    return this.client_;
  }

  async connect(): Promise<void> {
    if (this.client_) {
      throw new TooManyConnectionsError();
    }

    this.client_ = new Client({
      ...this.config,
    });

    await this.client.connect();
    this.client.on(
      "notice",
      (msg) =>
        msg.severity !== "NOTICE" && this.logger.info("Postgres notice", msg),
    );
    const originalQuery = this.client.query.bind(this.client);
    // @ts-expect-error abcd
    this.client.query = async (...args: Parameters<typeof originalQuery>) => {
      this.logger.debug(args[0]);
      return originalQuery(...args);
    };
  }

  async disconnect(): Promise<void> {
    await this.client.end();
    this.client_ = undefined;
  }

  @withErrorHandler
  async one<ResultSchema extends ZodSchemaType>(
    schema: ResultSchema,
    queryTextOrConfig: string | QueryConfig<unknown[]>,
    values?: unknown[] | Record<string, unknown>,
  ): Promise<z.infer<ResultSchema>> {
    const result = await this.client.query(
      ...escapeValues(queryTextOrConfig, values),
    );
    if (result.rowCount !== 1) {
      throw new InvalidRowNumberError(result.rowCount, 1, 1);
    }
    const { data, success, error } = z.array(schema).safeParse(result.rows);
    if (!success || data.length !== 1 || !data[0]) {
      throw new RowSchemaMismatchError(error?.issues);
    }

    return data[0];
  }

  @withErrorHandler
  async many<ResultSchema extends ZodSchemaType>(
    schema: ResultSchema,
    queryTextOrConfig: string | QueryConfig<unknown[]>,
    values?: unknown[] | Record<string, unknown>,
  ): Promise<z.infer<ResultSchema>[]> {
    const result = await this.client.query(
      ...escapeValues(queryTextOrConfig, values),
    );
    if (result.rowCount === 0) {
      throw new InvalidRowNumberError(result.rowCount, 1, Infinity);
    }
    const rows = result.rows;
    const parsed = z.array(schema).safeParse(rows);
    if (!parsed.success) {
      throw new RowSchemaMismatchError(parsed.error?.issues);
    }
    return parsed.data;
  }

  @withErrorHandler
  async any<ResultSchema extends ZodSchemaType>(
    schema: ResultSchema,
    queryTextOrConfig: string | QueryConfig<unknown[]>,
    values?: unknown[] | Record<string, unknown>,
  ): Promise<z.infer<ResultSchema>[]> {
    const result = await this.client.query(
      ...escapeValues(queryTextOrConfig, values),
    );
    if (result.rowCount === 0) {
      return [];
    }
    const rows = result.rows;
    const parsed = z.array(schema).safeParse(rows);
    if (!parsed.success) {
      throw new RowSchemaMismatchError(parsed.error?.issues);
    }
    return parsed.data;
  }

  @withErrorHandler
  async oneOrNone<ResultSchema extends ZodSchemaType>(
    schema: ResultSchema,
    queryTextOrConfig: string | QueryConfig<unknown[]>,
    values?: unknown[] | Record<string, unknown>,
  ): Promise<z.infer<ResultSchema> | null> {
    const result = await this.client.query(
      ...escapeValues(queryTextOrConfig, values),
    );
    if (result.rowCount === 0) {
      return null;
    }
    const { data, success, error } = z.array(schema).safeParse(result.rows);
    if (!success) {
      throw new RowSchemaMismatchError(error?.issues);
    }

    return data[0] || null;
  }

  @withErrorHandler
  async transaction(onTransaction: () => Promise<void>): Promise<void> {
    await this.client.query("BEGIN");
    try {
      await onTransaction();
      await this.client.query("COMMIT");
    } catch (error) {
      await this.client.query("ROLLBACK");
      throw error;
    }
  }

  @withErrorHandler
  async none(
    queryTextOrConfig: string | QueryConfig<unknown[]>,
    values?: unknown[] | Record<string, unknown>,
  ): Promise<void> {
    await this.client.query(...escapeValues(queryTextOrConfig, values));
  }
}
