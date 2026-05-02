import z from "zod";
import type { DbService } from "../sql/DbService.js";
import {
  paginated,
  toPaginatedResponse,
  type PaginatedResponse,
} from "../util/PaginatedResponse.js";

export type CollectionType = "dynamic" | "static";

const collectionRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  filter_expression: z.string(),
  is_favorite: z.boolean(),
  type: z.enum(["dynamic", "static"]),
  created_at: z.date(),
  updated_at: z.date(),
});

export type Collection = {
  id: string;
  name: string;
  description: string | undefined;
  filterExpression: string;
  isFavorite: boolean;
  type: CollectionType;
  createdAt: Date;
  updatedAt: Date;
};

export interface ListCollectionsRequest {
  limit: number;
  offset: number;
  type: CollectionType | undefined;
}

export interface CreateCollectionRequest {
  id: string;
  name: string;
  description?: string;
  filterExpression: string;
  isFavorite: boolean;
  type: CollectionType;
}

export interface UpdateCollectionRequest {
  id: string;
  name: string;
  description: string | null;
  filterExpression: string;
  isFavorite: boolean;
}

const toCollection = (
  row: z.infer<typeof collectionRowSchema>,
): Collection => ({
  id: row.id,
  name: row.name,
  description: row.description ?? undefined,
  filterExpression: row.filter_expression,
  isFavorite: row.is_favorite,
  type: row.type,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export class CollectionRepository {
  constructor(private readonly dbService: DbService) {}

  public async listCollections({
    limit,
    offset,
    type,
  }: ListCollectionsRequest): Promise<PaginatedResponse<Collection>> {
    const rows = await this.dbService.any(
      paginated(collectionRowSchema),
      `SELECT id, name, description, filter_expression, is_favorite, type, created_at, updated_at,
              COUNT(*) OVER()::int AS __total
       FROM collections
        ${type ? `WHERE type = $type` : ""}
       ORDER BY is_favorite DESC, created_at DESC
       LIMIT $limit OFFSET $offset`,
      type ? { limit, offset, type } : { limit, offset },
    );
    return toPaginatedResponse(
      rows.map((row) => ({ ...toCollection(row), __total: row.__total })),
    );
  }

  public async getCollection(id: string): Promise<Collection | null> {
    const row = await this.dbService.oneOrNone(
      collectionRowSchema,
      `SELECT id, name, description, filter_expression, is_favorite, type, created_at, updated_at
       FROM collections WHERE id = $id`,
      { id },
    );
    return row ? toCollection(row) : null;
  }

  public async createCollection(
    request: CreateCollectionRequest,
  ): Promise<Collection> {
    const row = await this.dbService.one(
      collectionRowSchema,
      `INSERT INTO collections (id, name, description, filter_expression, is_favorite, type)
       VALUES ($id, $name, $description, $filterExpression, $isFavorite, $type)
       RETURNING id, name, description, filter_expression, is_favorite, type, created_at, updated_at`,
      {
        id: request.id,
        name: request.name,
        description: request.description ?? null,
        filterExpression: request.filterExpression,
        isFavorite: request.isFavorite,
        type: request.type,
      },
    );
    return toCollection(row);
  }

  public async updateCollection(
    request: UpdateCollectionRequest,
  ): Promise<Collection | null> {
    const row = await this.dbService.oneOrNone(
      collectionRowSchema,
      `UPDATE collections
       SET name = $name, description = $description, filter_expression = $filterExpression,
           is_favorite = $isFavorite, updated_at = NOW()
       WHERE id = $id
       RETURNING id, name, description, filter_expression, is_favorite, type, created_at, updated_at`,
      {
        id: request.id,
        name: request.name,
        description: request.description,
        filterExpression: request.filterExpression,
        isFavorite: request.isFavorite,
      },
    );
    return row ? toCollection(row) : null;
  }

  public async deleteCollection(id: string): Promise<void> {
    await this.dbService.none(`DELETE FROM collections WHERE id = $id`, { id });
  }
}
