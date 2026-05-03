import { MetaTag, Tag, TagParser } from "@lars_hagemann/tags";
import type { DbService } from "../sql/DbService.js";
import {
  paginated,
  toPaginatedResponse,
  type PaginatedResponse,
} from "../util/PaginatedResponse.js";
import { TagParseError } from "./TagParseError.js";
import {
  buildQueryFromDeleteStatement,
  buildQueryFromInsertStatement,
  buildQueryFromSelectStatement,
  TagSqlBuilder,
} from "./TagSqlBuilder.js";
import z from "zod";
import type { Document } from "../documents/DocumentRepository.js";
import type { TagCache } from "./TagCache.js";

export interface ListTagsRequest {
  limit: number;
  offset: number;
  tag: ApiTag;
}

export type ListDocumentsRequest = {
  offset: number;
  limit: number;
  query: string;
  seed?: string;
};

const documentRowSchema = z.object({
  id: z.string(),
  mime: z.string(),
  previous_id: z.string().nullable(),
  next_id: z.string().nullable(),
  query_index: z.coerce.number().int().min(0),
});

const tagRowSchema = z.object({
  id: z.number(),
  key: z.string(),
  value: z.string().nullable(),
  type: z.string(),
});

const tagWithCountRowSchema = tagRowSchema.extend({
  usage_count: z.number().int(),
});

export type ApiTag = {
  key: string;
  value: string | undefined;
  type: string;
};

export type ApiTagWithCount = ApiTag & {
  usageCount: number;
};

export class TagRepository {
  private readonly sqlBuilder: TagSqlBuilder;

  constructor(
    private readonly dbService: DbService,
    private readonly tagCache: TagCache,
  ) {
    this.sqlBuilder = new TagSqlBuilder(
      {
        userdataTableName: "documents",
        userdataTableColumns: ["id", "mime"],
        userdataTableIdColumn: "id",
      },
      tagCache,
    );
  }

  public async listDocuments({
    offset,
    limit,
    query,
    seed,
  }: ListDocumentsRequest): Promise<PaginatedResponse<Document>> {
    const filter = new TagParser(query).parse();
    const sql = await this.sqlBuilder.buildListFilteredEntitiesQuery(filter);

    if (sql.success) {
      const isRandom = sql.stmt.sort?.find((s) => s.field === "_rand") !== undefined;

      const items = await this.dbService.any(
        paginated(documentRowSchema),
        buildQueryFromSelectStatement(sql.stmt),
        isRandom ? { limit, offset, seed: seed ?? null } : { limit, offset },
      );

      return toPaginatedResponse(
        items.map((item) => ({
          id: item.id,
          mime: item.mime,
          previousId: item.previous_id ?? undefined,
          nextId: item.next_id ?? undefined,
          queryIndex: item.query_index,
          __total: item.__total,
        })),
      );
    } else {
      throw new TagParseError(sql.message);
    }
  }

  public async listTags(
    request: ListTagsRequest,
  ): Promise<PaginatedResponse<ApiTagWithCount>> {
    const sql = this.sqlBuilder.buildListTagsQuery();

    if (sql.success) {
      const response = await this.dbService.any(
        paginated(tagWithCountRowSchema),
        buildQueryFromSelectStatement(sql.stmt),
        {
          limit: request.limit,
          offset: request.offset,
          tagKey: request.tag.key,
          tagValue: request.tag.value ? request.tag.value : null,
        },
      );
      return toPaginatedResponse(
        response.map((row) => ({
          key: row.key,
          value: row.value ?? undefined,
          usageCount: row.usage_count,
          type: row.type,
          __total: row.__total,
        })),
      );
    } else {
      throw new TagParseError(sql.message);
    }
  }

  public async addTags(tags: ApiTag[]): Promise<void> {
    let i = 1;
    const valuesStmt = tags
      .map(() => {
        return `($${i++}, $${i++}, $${i++})`;
      })
      .join(", ");

    console.log(tags);

    const result = await this.dbService.any(
      z.object({ id: z.number() }),
      `INSERT INTO tags (key, value, type) VALUES ${valuesStmt} ON CONFLICT DO NOTHING RETURNING id`,
      tags
        .map((tag) =>
          tag.value
            ? [tag.key, tag.value, tag.type]
            : [tag.key, null, tag.type],
        )
        .flat(1),
    );

    let j = 0;
    for (const row of result) {
      this.tagCache.onTagAdded(tags[j++]!, row.id.toString());
    }
  }

  public async addTagToDocument(
    documentId: string,
    tag: ApiTag,
  ): Promise<void> {
    const a = await this.sqlBuilder.buildAddTagToEntityQuery(tag);
    if (a.success) {
      await this.dbService.none(buildQueryFromInsertStatement(a.stmt), {
        entityId: documentId,
      });
    } else {
      throw new TagParseError(a.message);
    }
  }

  public async removeTagFromDocument(
    documentId: string,
    tag: Tag | MetaTag,
  ): Promise<void> {
    const a = await this.sqlBuilder.buildRemoveTagFromEntityQuery(tag);
    if (a.success) {
      await this.dbService.none(buildQueryFromDeleteStatement(a.stmt), {
        entityId: documentId,
      });
    } else {
      throw new TagParseError(a.message);
    }
  }

  public async getTagsForDocument(documentId: string): Promise<ApiTag[]> {
    const sql = this.sqlBuilder.buildListEntityTagsQuery();
    if (sql.success) {
      const rows = await this.dbService.any(
        tagRowSchema,
        buildQueryFromSelectStatement(sql.stmt),
        { entityId: documentId },
      );
      return rows.map((row) => ({
        key: row.key,
        value: row.value ?? undefined,
        type: row.type,
      }));
    } else {
      throw new TagParseError(sql.message);
    }
  }

  public async deleteTag(key: string, value: string): Promise<void> {
    await this.dbService.none(
      `DELETE FROM userdata_tags WHERE tag_id = (SELECT id FROM tags WHERE key = $key AND value = $value)`,
      { key, value },
    );
    await this.dbService.none(
      `DELETE FROM tags WHERE key = $key AND value = $value`,
      { key, value },
    );
    await this.tagCache.onTagDeleted({ key, value } as Tag);
  }

  public async enumerateTags() {
    const rows = await this.dbService.any(tagRowSchema, `SELECT * FROM tags`);
    return rows;
  }
}
