import z from "zod";
import type { DbService } from "../sql/DbService.js";
import type { CollectionAccessScope } from "../auth/AccessScope.js";
import { ApiError } from "../common/ApiError.js";
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
  owner_id: z.string(),
  is_public: z.boolean(),
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
  ownerId: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CollectionAccess = {
  ownerId: string;
  isPublic: boolean;
  shares: { userId: string; name: string | null; email: string | null }[];
};

export interface ListCollectionsRequest {
  limit: number;
  offset: number;
  type: CollectionType | undefined;
  scope: CollectionAccessScope;
}

export interface CreateCollectionRequest {
  id: string;
  name: string;
  description?: string;
  filterExpression: string;
  isFavorite: boolean;
  type: CollectionType;
  ownerId: string;
  isPublic: boolean;
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
  ownerId: row.owner_id,
  isPublic: row.is_public,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export class CollectionRepository {
  constructor(private readonly dbService: DbService) {}

  public async listCollections({
    limit,
    offset,
    type,
    scope,
  }: ListCollectionsRequest): Promise<PaginatedResponse<Collection>> {
    const scopeClause = buildCollectionScopeClause(scope);
    const params: Record<string, unknown> = { limit, offset };
    if (type) params.type = type;
    if (scope.type === "accessible-by") params.userId = scope.userId;

    const typeClause = type ? `AND type = $type` : "";
    const whereClause =
      scopeClause || typeClause
        ? `WHERE true ${scopeClause} ${typeClause}`
        : "";

    const rows = await this.dbService.any(
      paginated(collectionRowSchema),
      `SELECT id, name, description, filter_expression, is_favorite, type, owner_id, is_public, created_at, updated_at,
              COUNT(*) OVER()::int AS __total
       FROM collections
       ${whereClause}
       ORDER BY is_favorite DESC, created_at DESC
       LIMIT $limit OFFSET $offset`,
      params,
    );
    return toPaginatedResponse(
      rows.map((row) => ({ ...toCollection(row), __total: row.__total })),
    );
  }

  public async getCollection(
    id: string,
    scope: CollectionAccessScope = { type: "all" },
  ): Promise<Collection | null> {
    if (scope.type === "none") return null;

    const scopeClause = buildCollectionScopeClause(scope);
    const params: Record<string, unknown> = { id };
    if (scope.type === "accessible-by") params.userId = scope.userId;

    const row = await this.dbService.oneOrNone(
      collectionRowSchema,
      `SELECT id, name, description, filter_expression, is_favorite, type, owner_id, is_public, created_at, updated_at
       FROM collections WHERE id = $id${scopeClause}`,
      params,
    );
    return row ? toCollection(row) : null;
  }

  public async createCollection(
    request: CreateCollectionRequest,
  ): Promise<Collection> {
    const row = await this.dbService.one(
      collectionRowSchema,
      `INSERT INTO collections (id, name, description, filter_expression, is_favorite, type, owner_id, is_public)
       VALUES ($id, $name, $description, $filterExpression, $isFavorite, $type, $ownerId, $isPublic)
       RETURNING id, name, description, filter_expression, is_favorite, type, owner_id, is_public, created_at, updated_at`,
      {
        id: request.id,
        name: request.name,
        description: request.description ?? null,
        filterExpression: request.filterExpression,
        isFavorite: request.isFavorite,
        type: request.type,
        ownerId: request.ownerId,
        isPublic: request.isPublic,
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
       RETURNING id, name, description, filter_expression, is_favorite, type, owner_id, is_public, created_at, updated_at`,
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

  public async getCollectionAccess(
    collectionId: string,
  ): Promise<CollectionAccess> {
    const col = await this.dbService.oneOrNone(
      z.object({ owner_id: z.string(), is_public: z.boolean() }),
      "SELECT owner_id, is_public FROM collections WHERE id = $id",
      { id: collectionId },
    );

    if (!col) {
      throw new ApiError(
        "NotFound",
        404,
        `Collection ${collectionId} not found`,
      );
    }

    const shares = await this.dbService.any(
      z.object({
        user_id: z.string(),
        name: z.string().nullable(),
        email: z.string().nullable(),
      }),
      `SELECT cs.shared_with_user_id AS user_id, u.name, u.email
       FROM collection_shares cs
       JOIN users u ON cs.shared_with_user_id = u.id
       WHERE cs.collection_id = $collectionId`,
      { collectionId },
    );

    return {
      ownerId: col.owner_id,
      isPublic: col.is_public,
      shares: shares.map((s) => ({
        userId: s.user_id,
        name: s.name,
        email: s.email,
      })),
    };
  }

  public async updateCollectionAccess(
    collectionId: string,
    { isPublic, sharedWith }: { isPublic: boolean; sharedWith: string[] },
  ): Promise<void> {
    await this.dbService.transaction(async () => {
      await this.dbService.none(
        "UPDATE collections SET is_public = $isPublic WHERE id = $collectionId",
        { isPublic, collectionId },
      );
      await this.dbService.none(
        "DELETE FROM collection_shares WHERE collection_id = $collectionId",
        { collectionId },
      );
      for (const userId of sharedWith) {
        await this.dbService.none(
          "INSERT INTO collection_shares (collection_id, shared_with_user_id) VALUES ($collectionId, $userId) ON CONFLICT DO NOTHING",
          { collectionId, userId },
        );
      }
    });
  }
}

export function buildCollectionScopeClause(
  scope: CollectionAccessScope,
): string {
  if (scope.type === "all") return "";
  if (scope.type === "none") return " AND false";
  if (scope.type === "public-only") return " AND is_public = true";
  return " AND (is_public = true OR owner_id = $userId OR EXISTS (SELECT 1 FROM collection_shares cs WHERE cs.collection_id = id AND cs.shared_with_user_id = $userId))";
}
