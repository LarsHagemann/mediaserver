import {
  AndTag,
  MetaTag,
  NotTag,
  OrTag,
  Tag,
  TrueTag,
  type Filter,
} from "@lars_hagemann/tags";
import type { TagCache } from "./TagCache.js";

export type TagSqlBuilderConfig = {
  userdataTableName: string;
  userdataTableIdColumn: string;
  userdataTableColumns: string[];
};

export type SelectStatement = {
  with?: { name: string; body: string }[];
  select: string[];
  from: string;
  joins?: {
    join: "INNER" | "LEFT" | "RIGHT";
    table: string;
    on: string;
  }[];
  groupBy?: string;
  having?: string;
  sort?: {
    field: "timestamp" | "random" | string;
    direction?: "asc" | "desc";
    nulls?: "first" | "last";
  }[];
  where?: string;
  limit?: string | number;
  offset?: string | number;
};

export type OnConflict =
  | {
    action: "DO NOTHING";
  }
  | {
    action: "DO UPDATE";
    target?: string | string[];
    set: { [column: string]: string };
  };

export type UpdateStatement = {
  table: string;
  set: { [column: string]: string };
  where?: string;
  onConflict?: OnConflict;
};

export type DeleteStatement = {
  table: string;
  where?: string;
};

export type InsertStatement = {
  table: string;
  columns: string[];
  values: (string | number)[];
  onConflict?: OnConflict;
};

const buildQueryOrderByStatement = (stmt: SelectStatement["sort"]) => {
  const orderByClause =
    stmt && stmt.length > 0
      ? `ORDER BY ${stmt
        .map((s) =>
          s.field === "random"
            ? "RANDOM()"
            : `${s.field} ${s.direction?.toUpperCase() || ""} ${s.nulls ? `NULLS ${s.nulls.toUpperCase()}` : ""}`,
        )
        .join(", ")}`
      : "";

  return orderByClause;
};

export const buildQueryFromSelectStatement = (stmt: SelectStatement) => {
  const withClause =
    stmt.with && stmt.with.length > 0
      ? `WITH ${stmt.with.map((c) => `${c.name} AS (${c.body})`).join(", ")} `
      : "";
  const query = `${withClause}SELECT ${stmt.select} FROM ${stmt.from}`;
  const joinClauses = (stmt.joins ?? [])
    .map((join) => `${join.join} JOIN ${join.table} ON ${join.on}`)
    .join(" ");
  const whereClause = stmt.where ? `WHERE ${stmt.where}` : "";
  const groupByClause = stmt.groupBy ? `GROUP BY ${stmt.groupBy}` : "";
  const havingClause = stmt.having ? `HAVING ${stmt.having}` : "";
  const orderByClause = buildQueryOrderByStatement(stmt.sort);

  const limitClause = stmt.limit ? `LIMIT ${stmt.limit}` : "";
  const offsetClause = stmt.offset ? `OFFSET ${stmt.offset}` : "";

  return `${query} ${joinClauses} ${whereClause} ${groupByClause} ${havingClause} ${orderByClause} ${limitClause} ${offsetClause}`.trim();
};

const buildOnConflictAction = (action: OnConflict) => {
  if (action.action === "DO NOTHING") {
    return "DO NOTHING";
  } else {
    const targetClause = action.target
      ? `(${Array.isArray(action.target) ? action.target.join(", ") : action.target})`
      : "";
    const setClause = `SET ${Object.entries(action.set)
      .map(([col, val]) => `${col} = ${val}`)
      .join(", ")}`;
    return `${targetClause} ${action.action} ${setClause}`;
  }
};

export const buildQueryFromUpdateStatement = (stmt: UpdateStatement) => {
  const setClause = `SET ${Object.entries(stmt.set)
    .map(([col, val]) => `${col} = ${val}`)
    .join(", ")}`;
  const whereClause = stmt.where ? `WHERE ${stmt.where}` : "";
  const onConflictClause = stmt.onConflict
    ? `ON CONFLICT ${buildOnConflictAction(stmt.onConflict)}`
    : "";

  return `UPDATE ${stmt.table} ${setClause} ${whereClause} ${onConflictClause}`;
};

export const buildQueryFromDeleteStatement = (stmt: DeleteStatement) => {
  const whereClause = stmt.where ? `WHERE ${stmt.where}` : "";
  return `DELETE FROM ${stmt.table} ${whereClause}`;
};

export const buildQueryFromInsertStatement = (stmt: InsertStatement) => {
  const columnsClause = `(${stmt.columns.join(", ")})`;
  const valuesClause = `VALUES (${stmt.values
    .map((val) => (typeof val === "string" ? val : val.toString()))
    .join(", ")})`;
  const onConflictClause = stmt.onConflict
    ? `ON CONFLICT ${buildOnConflictAction(stmt.onConflict)}`
    : "";

  return `INSERT INTO ${stmt.table} ${columnsClause} ${valuesClause} ${onConflictClause}`;
};

export type TagSqlBuilderResult<
  T = SelectStatement,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Parameters extends string[] = [],
> =
  | {
    success: false;
    message: string;
  }
  | {
    success: true;
    stmt: T;
  };

type CurrentParse = {
  sortBy: "created_at" | "random";
  sortDirection: "asc" | "desc";
};

export class TagSqlBuilder {
  private readonly currentParse: CurrentParse;

  constructor(
    private readonly builderConfig: TagSqlBuilderConfig,
    private readonly tagCache: TagCache,
  ) {
    this.currentParse = {
      sortBy: "created_at",
      sortDirection: "asc",
    };
  }

  private async parseMetaTag(tag: MetaTag): Promise<string> {
    if (tag.key === "sort") {
      switch (tag.value) {
        case "random":
          this.currentParse.sortBy = "random";
          break;
        case "oldest":
          this.currentParse.sortBy = "created_at";
          this.currentParse.sortDirection = "asc";
          break;
        case "newest":
          this.currentParse.sortBy = "created_at";
          this.currentParse.sortDirection = "desc";
          break;
      }
      return `1=1`;
    }

    return `SUM(CASE WHEN ut.tag_id = '${await this.tagCache.tagToTagId(
      tag,
    )}' THEN 1 ELSE 0 END) > 0`;
  }

  private async sqlFilterConditions(filter: Filter): Promise<string> {
    if (filter instanceof Tag) {
      try {
        return `SUM(CASE WHEN ut.tag_id = '${await this.tagCache.tagToTagId(
          filter,
        )}' THEN 1 ELSE 0 END) > 0`;
      } catch (err) {
        if (err instanceof Error && err.message.includes("Tag not found")) {
          // This could be the key of a meta tag that is not listed in the tag id cache
          // For meta tags person:a, person:b etc. and filter 'person' we want to match any key=person and value=<any>
          return `EXISTS (SELECT * FROM userdata_tags sut INNER JOIN tags ON tags.id = sut.tag_id WHERE tags.key = '${filter.key}' AND sut.userdata_id = u.id)`;
        }
        throw err;
      }
    } else if (filter instanceof MetaTag) {
      return await this.parseMetaTag(filter);
    } else if (filter instanceof TrueTag) {
      return `1=1`;
    } else if (filter instanceof OrTag) {
      return `(${await this.sqlFilterConditions(
        filter.left,
      )} OR ${await this.sqlFilterConditions(filter.right)})`;
    } else if (filter instanceof AndTag) {
      return `(${await this.sqlFilterConditions(
        filter.left,
      )} AND ${await this.sqlFilterConditions(filter.right)})`;
    } else if (filter instanceof NotTag) {
      return `NOT (${await this.sqlFilterConditions(filter.inner)})`;
    }

    return "1=1";
  }

  private setupParse() {
    this.currentParse.sortBy = "created_at";
    this.currentParse.sortDirection = "desc";
  }

  public async buildListFilteredEntitiesQuery(
    filter: Filter,
  ): Promise<TagSqlBuilderResult<SelectStatement, ["$limit", "$offset"]>> {
    this.setupParse();

    const idCol = this.builderConfig.userdataTableIdColumn;
    const tableName = this.builderConfig.userdataTableName;
    const staticCols = this.builderConfig.userdataTableColumns;

    try {
      const havingCondition = await this.sqlFilterConditions(filter);

      if (this.currentParse.sortBy === "random") {
        // Use a CTE with a deterministic hash per (row, seed) so that the ORDER BY
        // and all window functions (LAG, LEAD, ROW_NUMBER) share the same ordering
        // across all queries with the same seed (pagination, thumbnail strip, etc.).
        const innerSelectCols = staticCols.map((col) => `u.${col}`).join(", ");
        const innerBody =
          `SELECT ${innerSelectCols}, HASHTEXT(u.${idCol} || $seed) AS _rand ` +
          `FROM ${tableName} u ` +
          `LEFT JOIN userdata_tags ut ON u.${idCol} = ut.userdata_id ` +
          `GROUP BY u.${idCol} ` +
          `HAVING ${havingCondition}`;

        return {
          success: true,
          stmt: {
            with: [{ name: "filtered_rand", body: innerBody }],
            select: [
              "COUNT(*) OVER()::int AS __total",
              ...staticCols,
              `row_number() OVER (ORDER BY _rand) - 1 AS query_index`,
              `LAG(${idCol}) OVER (ORDER BY _rand) AS previous_id`,
              `LEAD(${idCol}) OVER (ORDER BY _rand) AS next_id`,
            ],
            from: "filtered_rand",
            sort: [{ field: "_rand" }],
            limit: "$limit",
            offset: "$offset",
          },
        };
      } else {
        const sortDir = this.currentParse.sortDirection.toUpperCase();
        const windowOrderBy = `${this.currentParse.sortBy} ${sortDir}`;

        return {
          success: true,
          stmt: {
            select: [
              "COUNT(*) OVER()::int AS __total",
              ...staticCols,
              `row_number() OVER (ORDER BY ${windowOrderBy}) - 1 AS query_index`,
              `LAG(${idCol}) OVER (ORDER BY ${windowOrderBy}) AS previous_id`,
              `LEAD(${idCol}) OVER (ORDER BY ${windowOrderBy}) AS next_id`,
            ],
            from: `${tableName} u`,
            joins: [
              {
                join: "LEFT",
                table: "userdata_tags ut",
                on: `u.${idCol} = ut.userdata_id`,
              },
            ],
            groupBy: `u.${idCol}`,
            having: havingCondition,
            sort: [
              {
                field: this.currentParse.sortBy,
                direction: this.currentParse.sortDirection,
              },
            ],
            limit: "$limit",
            offset: "$offset",
          },
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  public buildListEntityTagsQuery(): TagSqlBuilderResult<
    SelectStatement,
    ["$entityId"]
  > {
    try {
      return {
        success: true,
        stmt: {
          select: ["t.*", "COUNT(ut.userdata_id) AS usage_count"],
          from: `tags t`,
          where: `ut.userdata_id = $entityId`,
          joins: [
            {
              join: "LEFT",
              table: "userdata_tags ut",
              on: `t.id = ut.tag_id`,
            },
          ],
          groupBy: `t.id`,
          sort: [
            {
              field: "t.key",
              direction: "asc",
            },
            {
              field: "t.value",
              direction: "asc",
            },
          ],
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  public async buildAddTagToEntityQuery(
    tag: Tag | MetaTag,
  ): Promise<TagSqlBuilderResult<InsertStatement, ["$entityId"]>> {
    try {
      const id = await this.tagCache.tagToTagId(tag);
      return {
        success: true,
        stmt: {
          table: "userdata_tags",
          columns: ["userdata_id", "tag_id"],
          values: ["$entityId", id],
          onConflict: {
            action: "DO NOTHING",
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  public async buildRemoveTagFromEntityQuery(
    tag: Tag | MetaTag,
  ): Promise<TagSqlBuilderResult<DeleteStatement, ["$entityId"]>> {
    try {
      const id = await this.tagCache.tagToTagId(tag);
      return {
        success: true,
        stmt: {
          table: "userdata_tags",
          where: `userdata_id = $entityId AND tag_id = '${id}'`,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  public buildListTagsQuery(): TagSqlBuilderResult<
    SelectStatement,
    ["$limit", "$offset", "$tagKey", "$tagValue"]
  > {
    this.setupParse();

    try {
      return {
        success: true,
        stmt: {
          select: [
            "t.*",
            "COUNT(ut.userdata_id)::int AS usage_count",
            "COUNT(*) OVER()::int AS __total",
          ],
          from: `tags t`,
          joins: [
            {
              join: "LEFT",
              table: "userdata_tags ut",
              on: `t.id = ut.tag_id`,
            },
          ],
          groupBy: `t.id`,
          limit: "$limit",
          offset: "$offset",
          where: `t.key ILIKE '%' || $tagKey || '%' AND ($tagValue::text IS NULL OR (t.value ILIKE '%' || $tagValue::text || '%' AND t.key = $tagKey))`,
          sort: [
            {
              field: "usage_count",
              direction: "desc",
            },
            {
              field: "t.key",
              direction: "asc",
            },
            {
              field: "t.value",
              direction: "asc",
            },
          ],
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
